import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});

  if (event.httpMethod === 'GET') {
    const { Items } = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
    return respond(200, Items || []);
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const { chapterId, type } = body;
    const sk = type === 'quiz' ? `quiz#${chapterId}` : `chapter#${chapterId}`;
    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { pk: 'user#default', sk, ...body, timestamp: new Date().toISOString() },
    }));
    return respond(200, { message: 'Progress saved' });
  }

  return respond(400, { message: 'Unsupported method' });
};
