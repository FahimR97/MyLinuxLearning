#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
const env = { account: '930479747902', region: 'eu-west-2' };

const frontend = new FrontendStack(app, 'FrontendStack', { env });
const backend = new BackendStack(app, 'BackendStack', { env });
new PipelineStack(app, 'PipelineStack', {
  env,
  frontendBucket: frontend.bucket,
  distributionId: frontend.distribution.distributionId,
});
