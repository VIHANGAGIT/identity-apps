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

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { ReactElement } from "react";
import { DynamicForm } from "../components/dynamic-form";
import { renderFormFields } from "../components/utils";

const FIELDS: Record<string, any>[] = [
    {
        label: "Daon Identity Verifier",
        name: "daon_idp_id",
        options: [
            { text: "Daon Identity Verifier", value: "verifier-uuid" },
            { text: "Daon Identity Verifier (EU)", value: "verifier-eu-uuid" }
        ],
        optionsSource: {
            templateId: "daon-idv",
            type: "connections"
        },
        placeholder: "Select a Daon Identity Verifier connection.",
        required: true,
        type: "select"
    },
    {
        label: "Login Process Definition",
        name: "daon_login_pd",
        placeholder: "e.g. LoginProcess:1",
        type: "string"
    }
];

const getForm = (onSubmit: (values: Record<string, any>) => void, initialValues?: Record<string, any>)
    : ReactElement => (
    <DynamicForm
        id="test-dynamic-form"
        uncontrolledForm={ false }
        initialValues={ initialValues }
        onSubmit={ onSubmit }
    >
        { renderFormFields(FIELDS) }
        <button type="submit">Submit</button>
    </DynamicForm>
);

describe("Dynamic form select field", () => {

    it("renders a select for a field of type `select` and keeps other fields as inputs", () => {
        render(getForm(vi.fn()));

        expect(screen.getByText("Daon Identity Verifier")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("e.g. LoginProcess:1")).toBeInTheDocument();
    });

    it("submits the value of the selected option", async () => {
        const onSubmit: any = vi.fn();

        render(getForm(onSubmit));

        fireEvent.mouseDown(screen.getByRole("combobox"));
        fireEvent.click(await screen.findByText("Daon Identity Verifier (EU)"));
        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalled();
            expect(onSubmit.mock.calls[ 0 ][ 0 ].daon_idp_id).toBe("verifier-eu-uuid");
        });
    });

    it("preselects the persisted value", () => {
        render(getForm(vi.fn(), { daon_idp_id: "verifier-uuid" }));

        expect(screen.getByRole("combobox")).toHaveTextContent("Daon Identity Verifier");
    });

    it("does not leak the options source declaration to the DOM", () => {
        const { container } = render(getForm(vi.fn()));

        expect(container.querySelector("[optionsSource]")).toBeNull();
    });
});
