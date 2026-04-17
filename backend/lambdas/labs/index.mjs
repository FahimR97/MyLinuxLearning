import { readFileSync } from 'fs';
import { join } from 'path';

const labs = JSON.parse(readFileSync(join(process.env.LAMBDA_TASK_ROOT || '.', 'content', 'labs.json'), 'utf-8'));

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});
  const chapterId = event.pathParameters?.chapterId;
  if (!chapterId) return respond(400, { message: 'chapterId required' });
  return respond(200, labs.filter(l => l.chapterId === chapterId));
};
