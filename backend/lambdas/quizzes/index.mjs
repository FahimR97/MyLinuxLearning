import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const quizzes = JSON.parse(readFileSync(join(__dirname, 'content', 'quizzes.json'), 'utf-8'));

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const respond = (code, body) => ({ statusCode: code, headers, body: JSON.stringify(body) });

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond(200, {});
  const chapterId = event.pathParameters?.chapterId;
  if (!chapterId) return respond(400, { message: 'chapterId required' });

  const chapterQs = quizzes.filter(q => q.chapterId === chapterId);

  if (event.httpMethod === 'POST') {
    const { answers } = JSON.parse(event.body || '{}');
    if (!answers) return respond(400, { message: 'answers required' });
    let score = 0;
    const results = chapterQs.map((q, i) => {
      const correct = answers[i] === q.correctAnswer;
      if (correct) score++;
      return { question: q.question, correct, correctAnswer: q.correctAnswer, yourAnswer: answers[i], explanation: q.explanation };
    });
    return respond(200, { score, total: results.length, results });
  }

  return respond(200, chapterQs.map(({ correctAnswer, ...rest }) => rest));
};
