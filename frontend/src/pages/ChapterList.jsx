import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getChapters, getProgress } from '../api/client';

export default function ChapterList() {
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    getChapters().then(setChapters);
    getProgress().then(setProgress);
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Chapters</h1>
      <p className="page-subtitle">12 chapters covering everything you need for Linux SysDE interviews</p>
      <div className="chapter-grid">
        {chapters.map(c => {
          const p = progress[c.id] || {};
          return (
            <Link to={`/chapters/${c.id}`} key={c.id} className="chapter-card">
              <div className="chapter-card-header">
                <span className="chapter-order">{String(c.order).padStart(2, '0')}</span>
                {p.read && <span className="badge badge-green">✓ Read</span>}
              </div>
              <h3 className="chapter-card-title">{c.title}</h3>
              <p className="chapter-card-desc">{c.description}</p>
              <div className="chapter-card-footer">
                <Link to={`/labs/${c.id}`} className="chip" onClick={e => e.stopPropagation()}>Labs</Link>
                <Link to={`/quizzes/${c.id}`} className="chip" onClick={e => e.stopPropagation()}>Quiz</Link>
                {p.quizScore != null && <span className="chip chip-score">{Math.round(p.quizScore / p.quizTotal * 100)}%</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
