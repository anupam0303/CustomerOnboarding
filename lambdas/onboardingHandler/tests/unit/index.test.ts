import * as lambdaFun from "../../index";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import * as AWS from "aws-sdk";

describe("customerOnboardingTests", () => {
    it("Get customerOnboarding lambda Function", () => {
        expect(true).toBe(true);
    });
    it("If request body is null then respond with 400 error ", async () => {
        const event: APIGatewayProxyEventV2 = {} as any;
        const result = await lambdaFun.handler(event);
        expect(JSON.parse(JSON.stringify(result)).statusCode).toBe(400);
        expect(JSON.parse(JSON.stringify(result)).body).toContain("error: No body is present in event");
    });
    it ("If body contains invalid object then respond with 400 error ", async () => {
        const event: APIGatewayProxyEventV2 = {body: {}} as any;
        const result = await lambdaFun.handler(event);
        expect(JSON.parse(JSON.stringify(result)).statusCode).toBe(400);
        expect(JSON.parse(JSON.stringify(result)).body).toContain('error: Invalid object schema');
    });
    it ("If body contains invalid email then respond with 400 error ", async () => {
        const event: APIGatewayProxyEventV2 = {body: {customerName: "test", adminUsers: ["test"], tier: "Pro", region: "Frankfurt"}} as any;
        const result = await lambdaFun.handler(event);
        expect(JSON.parse(JSON.stringify(result)).statusCode).toBe(400);
        expect(JSON.parse(JSON.stringify(result)).body).toContain('error: Invalid object schema');
    });
    it ("If body contains invalid tier then respond with 400 error ", async () => {
        const event: APIGatewayProxyEventV2 = {body: {customerName: "test", adminUsers: ["test@test.com"], tier: "Professional", region: "Frankfurt"}} as any;
        const result = await lambdaFun.handler(event);
        expect(JSON.parse(JSON.stringify(result)).statusCode).toBe(400);
        expect(JSON.parse(JSON.stringify(result)).body).toContain('error: Invalid object schema');
    });
    it ("If body contains valid customerOnboarding data then respond with 200 success ", async () => {
        const event: APIGatewayProxyEventV2 = {body: {customerName: "test", adminUsers: ["test@test.com"], tier: "Pro", region: "Frankfurt"}} as any;
        const result = await lambdaFun.handler(event);
        expect(JSON.parse(JSON.stringify(result)).statusCode).toBe(200);
        expect(JSON.parse(JSON.stringify(result)).body).toContain('success');
    });
});