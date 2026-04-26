import chaptersData from '../content/chapters.json';
import labsData from '../content/labs.json';
import quizzesData from '../content/quizzes.json';
import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  if (!API_BASE) return null;
  const token = await getToken();
  if (!token) { console.warn('[API] No token'); return null; }
  const headers = { ...options.headers };
  headers['Authorization'] = token;
  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (!res.ok) { console.warn('[API]', path, res.status); return null; }
    return res.json();
  } catch (e) { console.warn('[API]', path, e.message); return null; }
}

export async function getChapters() {
  const data = await request('/chapters');
  if (data) return data;
  return chaptersData.map(({ content, ...rest }) => rest).sort((a, b) => a.order - b.order);
}

export async function getChapter(id) {
  const data = await request(`/chapters/${encodeURIComponent(id)}`);
  if (data) return data;
  return chaptersData.find(c => c.id === id) || null;
}

export async function getLabs(chapterId) {
  const data = await request(`/labs/${encodeURIComponent(chapterId)}`);
  if (data) return data;
  return labsData.filter(l => l.chapterId === chapterId);
}

export async function getQuiz(chapterId) {
  const data = await request(`/quizzes/${encodeURIComponent(chapterId)}`);
  if (data) return data;
  return quizzesData.filter(q => q.chapterId === chapterId).map(({ correctAnswer, ...rest }) => rest);
}

export async function submitQuiz(chapterId, answers) {
  const data = await request(`/quizzes/${encodeURIComponent(chapterId)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (data) return data;
  // Offline fallback
  const questions = quizzesData.filter(q => q.chapterId === chapterId);
  let correct = 0;
  const results = questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctAnswer;
    if (isCorrect) correct++;
    return { question: q.question, correct: isCorrect, correctAnswer: q.correctAnswer, yourAnswer: answers[i], explanation: q.explanation };
  });
  return { score: correct, total: questions.length, results };
}

export async function getProgress() {
  const data = await request('/progress');
  if (data && typeof data === 'object') return data;
  return {};
}

export async function saveProgress(data) {
  await request('/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function resetProgress() {
  await request('/progress', { method: 'DELETE' });
}
