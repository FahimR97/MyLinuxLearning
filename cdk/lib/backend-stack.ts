import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backendPath = path.join(__dirname, '../../backend');

    const makeFn = (name: string, entry: string) => {
      const fn = new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(backendPath, {
          bundling: {
            image: lambda.Runtime.NODEJS_20_X.bundlingImage,
            command: [
              'bash', '-c',
              `cp -r /asset-input/lambdas/${entry}/* /asset-output/ && cp -r /asset-input/content /asset-output/content && cp -r /asset-input/node_modules /asset-output/node_modules`,
            ],
          },
          exclude: ['*.md'],
        }),
        environment: { TABLE_NAME: table.tableName },
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

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'MyLinuxLearning-API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const chapters = api.root.addResource('chapters');
    chapters.addMethod('GET', new apigateway.LambdaIntegration(chaptersFn));
    chapters.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(chaptersFn));

    const labs = api.root.addResource('labs');
    labs.addResource('{chapterId}').addMethod('GET', new apigateway.LambdaIntegration(labsFn));

    const quizzes = api.root.addResource('quizzes');
    const quizChapter = quizzes.addResource('{chapterId}');
    quizChapter.addMethod('GET', new apigateway.LambdaIntegration(quizzesFn));
    quizChapter.addResource('submit').addMethod('POST', new apigateway.LambdaIntegration(quizzesFn));

    const progress = api.root.addResource('progress');
    progress.addMethod('GET', new apigateway.LambdaIntegration(progressFn));
    progress.addMethod('POST', new apigateway.LambdaIntegration(progressFn));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
