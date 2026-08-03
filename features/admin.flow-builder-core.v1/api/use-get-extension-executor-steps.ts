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

import { FlowTypes } from "@wso2is/admin.flows.v1/models/flows";
import { useMemo } from "react";
import useGetMetadata from "./use-metadata";
import { MetadataInterface } from "../models/metadata";
import { Step } from "../models/steps";
import buildExtensionExecutorSteps from "../utils/build-extension-executor-steps";

/**
 * Hook that returns the palette steps for executors contributed by extensions deployed on the server.
 *
 * Reads the same `GET /flow/meta` response the flow builder core provider uses. The request is shared
 * rather than duplicated: SWR keys on the request config, so this resolves against the cached response
 * of the provider's call.
 *
 * @param flowType - Flow type whose metadata should be read.
 * @returns Steps to append to the palette. Empty until the metadata resolves.
 */
const useGetExtensionExecutorSteps = (flowType: FlowTypes): Step[] => {
    const { data: metadata } = useGetMetadata<MetadataInterface>(flowType, !!flowType);

    return useMemo(
        () => buildExtensionExecutorSteps(metadata?.extensionExecutors),
        [ metadata?.extensionExecutors ]
    );
};

export default useGetExtensionExecutorSteps;
