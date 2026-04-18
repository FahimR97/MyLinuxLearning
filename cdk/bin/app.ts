#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();
const env = { account: '930479747902', region: 'eu-west-2' };

const frontend = new FrontendStack(app, 'FrontendStack', { env });
const backend = new BackendStack(app, 'BackendStack', { env });
const auth = new AuthStack(app, 'AuthStack', { env });
new PipelineStack(app, 'PipelineStack', {
  env,
  frontendBucket: frontend.bucket,
  distributionId: frontend.distribution.distributionId,
});
