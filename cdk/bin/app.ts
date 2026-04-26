#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'eu-west-2',
};

const auth = new AuthStack(app, 'AuthStack', { env });
const frontend = new FrontendStack(app, 'FrontendStack', { env });
const backend = new BackendStack(app, 'BackendStack', {
  env,
  userPool: auth.userPool,
});
new PipelineStack(app, 'PipelineStack', {
  env,
  frontendBucket: frontend.bucket,
  distributionId: frontend.distribution.distributionId,
});
