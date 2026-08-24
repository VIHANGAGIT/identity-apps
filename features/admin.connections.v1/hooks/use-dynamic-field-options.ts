/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import get from "lodash-es/get";
import isEmpty from "lodash-es/isEmpty";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ConnectionsPagesResultInterface, useGetConnectionsPages } from "../api/connections";
import { StrictConnectionInterface } from "../models/connection";

/**
 * Number of connections fetched each time the dropdown is scrolled to its end.
 */
const CONNECTIONS_PAGE_SIZE: number = 10;

/**
 * Attributes the option list needs on top of the basic connection attributes.
 */
const CONNECTIONS_REQUIRED_ATTRIBUTES: string = "federatedAuthenticators,templateId";

/**
 * Supported option sources of a dynamic `select` field.
 */
enum DynamicFieldOptionsSourceTypes {
    /**
     * Options are the connections of the organization, optionally narrowed down by the
     * authenticator they use and the template they were created from.
     */
    CONNECTIONS = "connections"
}

/**
 * Declaration of where the options of a dynamic `select` field come from.
 */
interface DynamicFieldOptionsSourceInterface {
    /**
     * Type of the source. Only `connections` is supported at the moment.
     */
    type: DynamicFieldOptionsSourceTypes | string;
    /**
     * Only list connections having a federated authenticator with this id.
     */
    authenticatorId?: string;
    /**
     * Only list connections created from this connection template.
     */
    templateId?: string;
    /**
     * Exclude the connection that is currently being edited from the list.
     */
    excludeCurrent?: boolean;
    /**
     * Attribute of a connection persisted as the value of the field. Defaults to `id`.
     */
    valueField?: string;
    /**
     * Attribute of a connection displayed as the label of an option. Defaults to `name`.
     */
    labelField?: string;
}

/**
 * Context of the form the fields are rendered in.
 */
interface DynamicFieldOptionsContextInterface {
    /**
     * Resource id of the connection being edited, if any.
     */
    currentConnectionId?: string;
    /**
     * Values the form was initialized with, keyed by field name.
     */
    currentValues?: Record<string, any>;
}

/**
 * Return type of {@link useDynamicFieldOptions}.
 */
interface DynamicFieldOptionsResultInterface {
    /**
     * The given fields, with the options of every `optionsSource` backed field resolved.
     */
    fields: Record<string, any>[];
    /**
     * Whether the options are still being resolved.
     */
    isLoading: boolean;
}

/**
 * Resolves the options of dynamic form fields that declare an `optionsSource`.
 *
 * The dynamic form renderer (`@wso2is/forms/legacy` `renderFormFields`) only understands a static
 * `options` array, and a connector's `metadata.json` cannot know the connections of an organization.
 * This hook bridges the two: it reads the declarative `optionsSource` of each field and returns a
 * copy of the fields with a concrete `options` array attached, so a connector can offer a picker of
 * existing connections without any connector specific code in the console.
 *
 * Fields without an `optionsSource` are returned untouched and no request is made.
 *
 * @param fields - Dynamic form field definitions, as read from the connector metadata.
 * @param context - Context of the form the fields are rendered in.
 *
 * @returns The fields with resolved options and the resolution status.
 */
const useDynamicFieldOptions = (
    fields: Record<string, any>[],
    context?: DynamicFieldOptionsContextInterface
): DynamicFieldOptionsResultInterface => {

    const { t } = useTranslation();

    /**
     * Sources declared by the given fields. Empty for every form that does not use the feature.
     */
    const sources: DynamicFieldOptionsSourceInterface[] = useMemo(() => {
        if (!Array.isArray(fields)) {
            return [];
        }

        return fields
            .map((field: Record<string, any>) => field?.optionsSource)
            .filter((source: DynamicFieldOptionsSourceInterface) =>
                source?.type === DynamicFieldOptionsSourceTypes.CONNECTIONS);
    }, [ fields ]);

    /**
     * Template the options are scoped to. Optional, and taken from the first source that declares one.
     */
    const templateId: string = useMemo(
        () => sources
            .map((source: DynamicFieldOptionsSourceInterface) => source?.templateId)
            .find((declared: string) => !isEmpty(declared)),
        [ sources ]
    );

    const filter: string = isEmpty(templateId)
        ? "isEnabled eq \"true\""
        : `templateId eq "${ templateId }" and isEnabled eq "true"`;

    const {
        connections,
        hasMore,
        isLoading,
        isLoadingMore,
        loadMore
    }: ConnectionsPagesResultInterface = useGetConnectionsPages(
        CONNECTIONS_PAGE_SIZE,
        filter,
        CONNECTIONS_REQUIRED_ATTRIBUTES,
        sources.length > 0
    );

    /**
     * Connections that satisfy every filter of a source that can be evaluated on the list response.
     */
    const getCandidates = (source: DynamicFieldOptionsSourceInterface): StrictConnectionInterface[] => {
        return connections.filter((connection: StrictConnectionInterface) => {
            if (connection?.id === context?.currentConnectionId) {
                return false;
            }

            if (!source?.authenticatorId) {
                return true;
            }

            return connection?.federatedAuthenticators?.authenticators
                ?.some((authenticator: { authenticatorId?: string }) =>
                    authenticator?.authenticatorId === source.authenticatorId) ?? false;
        });
    };

    /*
     * Without a template the authenticator is matched on the client, so a fetched page can leave too few options to
     * overflow the menu, and without a scrollbar there is no way to reach the next page. Keep asking for pages until
     * a page's worth of options survives the match, or until the list is exhausted.
     */
    useEffect(() => {
        if (!isEmpty(templateId) || isLoading || isLoadingMore || !hasMore) {
            return;
        }

        const isUnderfilled: boolean = sources.some((source: DynamicFieldOptionsSourceInterface) =>
            getCandidates(source).length < CONNECTIONS_PAGE_SIZE);

        if (isUnderfilled) {
            loadMore();
        }
    }, [ templateId, isLoading, isLoadingMore, hasMore, connections, sources ]);

    const resolvedFields: Record<string, any>[] = useMemo(() => {
        if (!Array.isArray(fields)) {
            return fields;
        }

        return fields.map((field: Record<string, any>) => {
            const source: DynamicFieldOptionsSourceInterface = field?.optionsSource;

            if (source?.type !== DynamicFieldOptionsSourceTypes.CONNECTIONS) {
                return field;
            }

            const valueField: string = source?.valueField ?? "id";
            const labelField: string = source?.labelField ?? "name";

            const options: { text: string; value: string }[] = getCandidates(source)
                .map((connection: StrictConnectionInterface) => ({
                    text: get(connection, labelField) ?? get(connection, "id"),
                    value: get(connection, valueField)
                }))
                .filter((option: { text: string; value: string }) => !isEmpty(option.value));

            /*
             * Keep an already persisted value selectable even when it is not part of the resolved options.
             */
            const persistedValue: string = context?.currentValues?.[ field?.name ];

            if (!isEmpty(persistedValue)
                && !options.some((option: { value: string }) => option.value === persistedValue)) {
                options.push({
                    text: isLoading
                        ? persistedValue
                        : t("authenticationProvider:forms.authenticatorSettings.dynamicOptions.unavailable", {
                            value: persistedValue
                        }),
                    value: persistedValue
                });
            }

            const isUnusable: boolean = isLoading || isEmpty(options);

            return {
                ...field,
                hasMore,
                isLoadingMore,
                onLoadMore: loadMore,
                options,
                placeholder: isLoading
                    ? t("authenticationProvider:forms.authenticatorSettings.dynamicOptions.loading")
                    : (isEmpty(options)
                        ? t("authenticationProvider:forms.authenticatorSettings.dynamicOptions.empty")
                        : field?.placeholder),
                readOnly: field?.readOnly || isUnusable
            };
        });
    }, [ fields, connections, hasMore, isLoadingMore, isLoading, loadMore, context?.currentValues ]);

    return {
        fields: resolvedFields,
        isLoading
    };
};

export default useDynamicFieldOptions;
