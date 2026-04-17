import { readFileSync } from 'fs';
import { join } from 'path';

const chapters = JSON.parse(readFileSync(join(process.env.LAMBDA_TASK_ROOT || '.', 'content', 'chapters.json'), 'utf-8'));

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});
  const id = event.pathParameters?.id;
  if (!id) {
    return respond(200, chapters.map(({ id, title, description, order }) => ({ id, title, description, order })));
  }
  const ch = chapters.find(c => c.id === id);
  return ch ? respond(200, ch) : respond(404, { message: 'Not found' });
};
