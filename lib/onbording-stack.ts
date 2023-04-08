import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, RestApi, Period } from "aws-cdk-lib/aws-apigateway";
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Table, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class OnbordingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB Tables

    // Teams Table
    const teamsTable = new Table(this, "teamsTable", {
      tableName: "teams",
      partitionKey: { name: "teamId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    teamsTable.addGlobalSecondaryIndex({
      indexName: "UserIdIndex",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL
    });

    // Tasks Table
    const tasksTtable = new Table(this, "tasksTable", {
      tableName: "tasks",
      partitionKey: { name: "taskId", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    tasksTtable.addGlobalSecondaryIndex({
      indexName: "TeamIdIndex",
      partitionKey: { name: "teamId", type: AttributeType.STRING },
      sortKey: { name: "taskId", type: AttributeType.STRING },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });
    

    // Create SQS Queue
    const queue = new sqs.Queue(this, 'OnbordingQueue', {
      queueName: "OnbordingQueue",
      visibilityTimeout: cdk.Duration.seconds(30)
    });

    // Create Lambda Function
    const customerOnboardingLambda = new lambda.Function(this, "customerOnboardingFunction", {
      functionName: "customerOnboardingFunction",
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      tracing: lambda.Tracing.ACTIVE,
      code: lambda.Code.fromAsset(path.join(__dirname, `/../lambdas/onboardingHandler/`)),
      environment: {
        "queueUrl": queue.queueUrl
      }
    });
    // Add permission for lambda to be able to send messages to queue
    queue.grantSendMessages(customerOnboardingLambda);

    // Define API
    const restApi = new RestApi(this, "customer-onboarding-api", {
      restApiName: "Customer Onboarding API",
      description: "This API takes onboarding requests and put them into a queue for further processing",
      deployOptions: {
        stageName: "prod",
        tracingEnabled: true,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
        allowMethods: ["OPTIONS", "POST"],
        allowOrigins: ["*"],
      },
    });

    // Add usage plan for API
    const plan = restApi.addUsagePlan("UsagePlan", {
      name: "OnboardingApi",
      throttle: {
        rateLimit: 5,
        burstLimit: 10,
      },
      quota: {
        limit: 1000,
        period: Period.MONTH,
      },
    });

    // Integration with Lambda
    const lambdaIntegration = new LambdaIntegration(customerOnboardingLambda, { proxy: true });

    //Add POST method
    const postMethod = restApi.root.addMethod("POST", lambdaIntegration, { apiKeyRequired: false });

    // State Machine
    const startState = new stepfunctions.Pass(this, 'Start-processing', {
      result: { value: "$[*]..['body','messageId']" }
    });

    const stateMachine = new stepfunctions.StateMachine(this, 'OnboardingStateMachine', {
      definition: startState,
      stateMachineType: stepfunctions.StateMachineType.STANDARD,
      stateMachineName: "OnboardingStateMachine"
    });

  }
}
