import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import { defineFeature, loadFeature } from "jest-cucumber";
import { DefineScenarioFunctionWithAliases } from "jest-cucumber/dist/src/feature-definition-creation";
import { ParsedFeature } from "jest-cucumber/dist/src/models";
import * as path from "path";

const apiUrl = process.env.URL || "http://127.0.0.1:3000/onboarding";

const feature: ParsedFeature = loadFeature(path.join(__dirname, "../features/onboarding.feature"));

defineFeature(feature, (test: DefineScenarioFunctionWithAliases) => {
    test("user posts customer onboarding info without tier information", ({ given, when, then }) => {
        let invalidRequestBody: {};
        let responseCode: number;
        let responseMessage: string;
        given("tier information is not in the request", () => {
            invalidRequestBody = {customerName: "test", adminUsers: ["test@test.com"], region: "Frankfurt"};
        });
        when("user posts onboarding request", async () => {
            try {
                const response = await axios.post(`${apiUrl}`, invalidRequestBody);
                responseCode = response.status;
                responseMessage = response.data;
            } catch (err) {
                if (isAxiosError(err)) {
                    responseCode = err.response?.status as number;
                    responseMessage = err.response?.data as string;
                }
                return;
            }
        });
        then("endpoint should return 400", async () => {
            expect(responseCode).toEqual(400);
            expect(JSON.stringify(responseMessage)).toContain('error: Invalid object schema');
        });
    });

    test("user posts valid customer onboarding", ({ given, when, then }) => {
        let validRequestBody: {};
        let responseCode: number;
        let responseMessage: string;
        given("user makes valid customer onboarding request", () => {
            validRequestBody = {customerName: "test", adminUsers: ["test@test.com"], tier: "Pro", customerRegion: "Frankfurt"};
        });
        when("user posts onboarding request", async () => {
            try {
                const response = await axios.post(`${apiUrl}`, validRequestBody);
                console.log(response);
                responseCode = response.status;
                responseMessage = response.data;
            } catch (err) {
                if (isAxiosError(err)) {
                    console.log(err);
                    responseCode = err.response?.status as number;
                    responseMessage = err.response?.data as string;
                }
                return;
            }
        });
        then("endpoint should return 200", async () => {
            expect(responseCode).toEqual(200);
            expect(JSON.stringify(responseMessage)).toContain('success');
        });
    });
});