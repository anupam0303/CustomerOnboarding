import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as yup from 'yup';

interface JSONObject {
    [key: string]: string;
}

const customerOnboardingDataSchema = yup.object({
    customerName: yup.string().defined().required(),
    adminUsers: yup.array().of(yup.string().email()).required(),
    tier: yup.string().oneOf(["Pro"]).required(),
    region: yup.string().oneOf(["Northern Virginia", "Frankfurt" ]).required()
});

const QUEUE_URL = process.env.queueUrl;
const sqs = new AWS.SQS({region: "eu-central-1"});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    console.log("Queue URL: " , QUEUE_URL);
    if (!event.body) {
        return sendResponse(400, { message: "error: No body is present in event" });
    } else {
        try {
            console.log("onboarding data: ", event.body);
            if ( typeof(event.body) !== "object") {
                await customerOnboardingDataSchema.validate(JSON.parse(event.body));
            }
            else {
                await customerOnboardingDataSchema.validate(event.body);
            }
            console.log("Validation success, putting into queue");
            const params = {
                MessageBody: event.body,
                QueueUrl: QUEUE_URL,
                MessageGroupId: "customerOnboarding"
            }
            try {
                const result = await sqs.sendMessage(params);
                console.log("Message successfully sent: " + result);

            } catch(err) {
                console.log("Error: could not send message to the queue: " + err);
                return sendResponse(500, { message: "error: Sorry, couldn't take request, please try again" });
            }
            
            return sendResponse(200, { message: "success: Request taken" });
        } catch (err) {
            console.log(err);
            return sendResponse(400, { message: 'error: Invalid object schema , expected {customerName: "name", adminUsers: ["test@test.com"], tier: "Pro", region: "Frankfurt" }' });
        }
    }
}

const sendResponse = (statusCode: number, body: JSONObject) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "OPTIONS,POST,PUT",
        },
    };
};