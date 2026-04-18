import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface PipelineStackProps extends cdk.StackProps {
  frontendBucket: s3.IBucket;
  distributionId: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const provider = new iam.OpenIdConnectProvider(this, 'GitHubOIDC', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const role = new iam.Role(this, 'GitHubActionsRole', {
      assumedBy: new iam.FederatedPrincipal(
        provider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub':
              'repo:FahimR97/MyLinuxLearning:ref:refs/heads/main',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [props.frontendBucket.bucketArn, `${props.frontendBucket.bucketArn}/*`],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [`arn:aws:cloudfront::${this.account}:distribution/${props.distributionId}`],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:UpdateFunctionCode'],
      resources: [`arn:aws:lambda:${this.region}:${this.account}:function:*`],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudformation:DescribeStackResource', 'cloudformation:ListStackResources'],
      resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/BackendStack/*`],
    }));

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: ['*'],
    }));

    new cdk.CfnOutput(this, 'OIDCRoleArn', { value: role.roleArn });
  }
}
