/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
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

import { FlowTypes } from "@wso2is/admin.flows.v1/models/flows";

/**
 * Interface for common metadata.
 */
export interface MetadataInterface {
    /**
     * The type of the flow.
     */
    flowType: FlowTypes;
    /**
     * Supported executors for the flow.
     */
    supportedExecutors: string[];
    /**
     * Connector configuration for the flow.
     */
    connectorConfigs: ConnectorConfigs;
    /**
     * The default attribute profile to be used.
     */
    attributeProfile: string;
    /**
     * Supported flow completion configurations.
     */
    supportedFlowCompletionConfigs?: string[];
    /**
     * Metadata for attributes used in the flow.
     */
    attributeMetadata: AttributeMetadataInterface[];
    /**
     * List of executor connections.
     */
    executorConnections: ExecutorConnectionInterface[];
    /**
     * List of active flow extension connections from metadata.
     */
    flowExtensionConnections?: FlowExtensionConnectionInterface[];
    /**
     * Executors contributed by an extension deployed on the server, such as a connector placed in
     * `repository/components/dropins`.
     *
     * These are not known to the console at build time, so they are turned into palette steps at
     * runtime instead of being declared in `steps.json`. Built in executors are not described here;
     * they are advertised by name in {@link MetadataInterface.supportedExecutors} only.
     */
    extensionExecutors?: ExtensionExecutorInterface[];
    /**
     * Is a Workflow engagement enabled?
     */
    workflowEnabled: boolean;
};

/**
 * Common connector configuration interface.
 */
interface ConnectorConfigs {
    /**
     * Indicates if multi-attribute login is enabled.
     */
    multiAttributeLoginEnabled: boolean;
    /**
     * Indicates if account verification is enabled.
     */
    accountVerificationEnabled: boolean;
}

/**
 * Interface for attribute metadata.
 */
interface AttributeMetadataInterface {
    /**
     * The name of the attribute.
     */
    name: string;
    /**
     * Claim URI of the attribute.
     */
    claimURI: string;
    /**
     * Indicates if the attribute is required.
     */
    required: boolean;
    /**
     * Indicates if the attribute is read-only.
     */
    readOnly: boolean;
    /**
     * List of validators for the attribute.
     */
    validators: string[];
}

/**
 * Interface for executor connection.
 */
export interface ExecutorConnectionInterface {
    /**
     * The name of the executor.
     */
    executorName: string;
    /**
     * List of connections for the executor.
     */
    connections: string[];
}

/**
 * Interface for an executor contributed by an extension deployed on the server.
 *
 * Everything the console needs in order to offer the executor as a step is carried here, so a newly
 * deployed connector shows up without a console release.
 */
export interface ExtensionExecutorInterface {
    /**
     * Unique name of the executor, as registered with the flow execution engine. This is the value
     * written to `data.action.executor.name`, and the key used by `executorConnections`.
     */
    name: string;
    /**
     * Human readable name shown in the palette and on the canvas node.
     */
    displayName?: string;
    /**
     * Short explanation of what the step does, shown under the label in the palette.
     */
    description?: string;
    /**
     * Reserved tags declared by the executor, e.g. `RECOVERY_FACTOR`. Interpreted by the server, not
     * by the composer.
     */
    tags?: string[];
    /**
     * Icon for the executor. Either an absolute URL or a path relative to the console static
     * resources, both of which `loadStaticResource` handles.
     */
    icon?: string;
    /**
     * Whether a connection has to be selected before a step using this executor is valid. Drives
     * whether the connection picker is shown in the property panel.
     */
    requiresConnection?: boolean;
    /**
     * Name of the authenticator backing this executor.
     */
    associatedAuthenticator?: string;
}

/**
 * Interface for flow extension connection info from flow metadata.
 */
export interface FlowExtensionConnectionInterface {
    /**
     * The action ID.
     */
    actionId: string;
    /**
     * The display name of the connection.
     */
    name: string;
    /**
     * Optional icon URL for the connection.
     */
    iconUrl?: string;
}
