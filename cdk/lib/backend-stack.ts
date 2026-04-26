import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

interface BackendStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const allowedOrigin = ssm.StringParameter.valueForStringParameter(this, '/mylinuxlearning/cloudfront-domain');
    const instanceId = ssm.StringParameter.valueForStringParameter(this, '/mylinuxlearning/ec2-instance-id');

    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    const backendRoot = path.join(__dirname, '../../backend');

    const makeFn = (name: string, handlerDir: string) => {
      const fn = new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: `lambdas/${handlerDir}/index.handler`,
        code: lambda.Code.fromAsset(backendRoot, {
          exclude: ['node_modules/.cache', '*.md'],
        }),
        environment: {
          TABLE_NAME: table.tableName,
          ALLOWED_ORIGIN: allowedOrigin,
        },
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
      });
      table.grantReadWriteData(fn);
      return fn;
    };

    const chaptersFn = makeFn('ChaptersFn', 'chapters');
    const labsFn = makeFn('LabsFn', 'labs');
    const quizzesFn = makeFn('QuizzesFn', 'quizzes');
    const progressFn = makeFn('ProgressFn', 'progress');

    const aiFeedbackFn = new lambda.Function(this, 'AIFeedbackFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambdas/ai-feedback/index.handler',
      code: lambda.Code.fromAsset(backendRoot, {
        exclude: ['node_modules/.cache', '*.md'],
      }),
      environment: {
        TABLE_NAME: table.tableName,
        ALLOWED_ORIGIN: allowedOrigin,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });
    aiFeedbackFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'],
    }));

    // Cognito authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props.userPool],
    });
    const authMethodOpts = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'MyLinuxLearning-API',
      defaultCorsPreflightOptions: {
        allowOrigins: [allowedOrigin],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        throttlingRateLimit: 10,
        throttlingBurstLimit: 20,
      },
    });

    const chapters = api.root.addResource('chapters');
    chapters.addMethod('GET', new apigateway.LambdaIntegration(chaptersFn), authMethodOpts);
    chapters.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(chaptersFn), authMethodOpts);

    const labs = api.root.addResource('labs');
    labs.addResource('{chapterId}').addMethod('GET', new apigateway.LambdaIntegration(labsFn), authMethodOpts);

    const quizzes = api.root.addResource('quizzes');
    const quizChapter = quizzes.addResource('{chapterId}');
    quizChapter.addMethod('GET', new apigateway.LambdaIntegration(quizzesFn), authMethodOpts);
    quizChapter.addResource('submit').addMethod('POST', new apigateway.LambdaIntegration(quizzesFn), authMethodOpts);

    const progress = api.root.addResource('progress');
    progress.addMethod('GET', new apigateway.LambdaIntegration(progressFn), authMethodOpts);
    progress.addMethod('POST', new apigateway.LambdaIntegration(progressFn), authMethodOpts);
    progress.addMethod('DELETE', new apigateway.LambdaIntegration(progressFn), authMethodOpts);

    const aiFeedback = api.root.addResource('ai-feedback');
    aiFeedback.addMethod('POST', new apigateway.LambdaIntegration(aiFeedbackFn), authMethodOpts);

    // Lab verification Lambda — scoped SSM permissions
    const labVerifyFn = new lambda.Function(this, 'LabVerifyFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambdas/lab-verify/index.handler',
      code: lambda.Code.fromAsset(backendRoot, {
        exclude: ['node_modules/.cache', '*.md'],
      }),
      environment: {
        EC2_INSTANCE_ID: instanceId,
        EC2_REGION: 'us-west-2',
        ALLOWED_ORIGIN: allowedOrigin,
      },
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
    });
    labVerifyFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['ssm:SendCommand'],
      resources: [
        `arn:aws:ec2:us-west-2:${this.account}:instance/${instanceId}`,
        `arn:aws:ssm:us-west-2::document/AWS-RunShellScript`,
      ],
    }));
    labVerifyFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['ssm:GetCommandInvocation'],
      resources: [`arn:aws:ssm:us-west-2:${this.account}:*`],
    }));

    const labVerify = labs.addResource('verify');
    labVerify.addMethod('POST', new apigateway.LambdaIntegration(labVerifyFn), authMethodOpts);

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
