import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as yup from 'yup';
import * as Xray from "aws-xray-sdk";
const aws = Xray.captureAWS(AWS);

interface JSONObject {
    [key: string]: string;
}

const customerOnboardingDataSchema = yup.object({
    customerName: yup.string().defined().required(),
    adminUsers: yup.array().of(yup.string().email()).required(),
    tier: yup.string().oneOf(["Pro"]).required(),
    customerRegion: yup.string().oneOf(["Northern Virginia", "Frankfurt"]).required()
});

const QUEUE_URL = process.env.queueUrl || "https://sqs.us-east-1.amazonaws.com/231401767112/OnbordingQueue";
//AWS.config.update({ region: "us-east-1" });
//const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

export const getSQSClient = () => {
    const client = new aws.SQS({ apiVersion: '2012-11-05', region: "us-east-1" });
    return client;
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    console.log("Queue URL: ", QUEUE_URL);
    let messageBody: object;
    if (!event.body) {
        return sendResponse(400, { message: "error: No body is present in event" });
    } else {
        console.log('typeof (event.body)', typeof (event.body));
        if (typeof (event.body) !== "object") {
            messageBody = JSON.parse(event.body);
        }
        else {
            messageBody = event.body;
        }
        try {
            console.log("onboarding data: ", JSON.stringify(messageBody));
            await customerOnboardingDataSchema.validate(messageBody);
            console.log("Validation success, putting into queue");
            const params = {
              DelaySeconds: 10,
              MessageBody: JSON.stringify(messageBody),
              QueueUrl: QUEUE_URL,
              //MessageGroupId: "customerOnboarding",
            };
            let messageId: string;
            try {
                console.log(
                    "Sending message to queue: " + JSON.stringify(params)
                );
                const data = await getSQSClient().sendMessage(params).promise();
                console.log(
                  "Message successfully sent: " + JSON.stringify(data.MessageId)
                );
                messageId= data.MessageId;
            } catch (err) {
                console.log("Error: could not send message to the queue: " + err);
                return sendResponse(500, { message: "error: Sorry, couldn't take request, please try again" });
            }
            return sendResponse(200, { message: "success: Request taken, messageId: " + messageId });
        } catch (err) {
            console.log(err);
            return sendResponse(400, { message: 'error: Invalid object schema , expected {customerName: "name", adminUsers: ["test@test.com"], tier: "Pro", customerRegion: "Frankfurt" }' });
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