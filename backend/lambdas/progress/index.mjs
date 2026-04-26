import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

function getUserId(event) {
  return event.requestContext?.authorizer?.claims?.sub || 'default';
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});

  const userId = getUserId(event);
  const pk = `user#${userId}`;
  console.log('Method:', event.httpMethod, 'UserId:', userId, 'Body:', event.body);

  if (event.httpMethod === 'GET') {
    const { Items } = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': pk },
    }));
    // Return as { chapterId: { ...data } } for frontend compatibility
    const progress = {};
    for (const item of Items || []) {
      if (item.chapterId) {
        const { pk: _pk, sk: _sk, ...data } = item;
        progress[item.chapterId] = { ...(progress[item.chapterId] || {}), ...data };
      }
    }
    return respond(200, progress);
  }

  if (event.httpMethod === 'DELETE') {
    const { Items } = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': pk },
    }));
    for (const item of Items || []) {
      await client.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: item.pk, sk: item.sk } }));
    }
    return respond(200, { message: 'Progress reset' });
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    // Frontend sends { [chapterId]: { quizScore, quizTotal, read, ... } }
    for (const [chapterId, data] of Object.entries(body)) {
      if (!/^[a-zA-Z0-9-]+$/.test(chapterId)) continue;
      const type = data.quizScore != null ? 'quiz' : 'chapter';
      const sk = type === 'quiz' ? `quiz#${chapterId}` : `chapter#${chapterId}`;
      await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { pk, sk, chapterId, ...data, timestamp: new Date().toISOString() },
      }));
    }
    return respond(200, { message: 'Progress saved' });
  }

  return respond(400, { message: 'Unsupported method' });
};
