import chaptersData from '../content/chapters.json';
import labsData from '../content/labs.json';
import quizzesData from '../content/quizzes.json';

import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  if (!API_BASE) return null;
  const token = await getToken() || localStorage.getItem('fll-session');
  if (!token) return null;
  const headers = { ...options.headers };
  headers['Authorization'] = token;
  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
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
  if (API_BASE) {
    const data = await request(`/quizzes/${encodeURIComponent(chapterId)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (data) return data;
  }
  const questions = quizzesData.filter(q => q.chapterId === chapterId);
  let correct = 0;
  const results = questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctAnswer;
    if (isCorrect) correct++;
    return { question: q.question, correct: isCorrect, correctAnswer: q.correctAnswer, yourAnswer: answers[i], explanation: q.explanation };
  });
  return { score: correct, total: questions.length, results };
}

const PROGRESS_KEY = 'linux-learning-progress';

export async function getProgress() {
  if (API_BASE) {
    const data = await request('/progress');
    if (data) return data;
  }
  return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
}

export async function saveProgress(data) {
  if (API_BASE) {
    await request('/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return;
  }
  const existing = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...existing, ...data }));
}

export async function resetProgress() {
  if (API_BASE) {
    await request('/progress', { method: 'DELETE' });
  }
  localStorage.removeItem(PROGRESS_KEY);
}
