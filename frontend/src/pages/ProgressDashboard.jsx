import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChapters, getProgress } from '../api/client';

export default function ProgressDashboard() {
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    getChapters().then(setChapters);
    getProgress().then(setProgress);
  }, []);

  const total = chapters.length || 1;
  const readCount = Object.keys(progress).filter(k => progress[k]?.read).length;
  const quizCount = Object.keys(progress).filter(k => progress[k]?.quizScore != null).length;
  const overallPct = Math.round((readCount / total) * 100);

  return (
    <div className="page progress-page">
      <h1 className="page-title">Progress Dashboard</h1>

      <div className="progress-overview">
        <div className="progress-ring-card">
          <svg viewBox="0 0 120 120" className="progress-ring">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#30363d" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#39d353" strokeWidth="8"
              strokeDasharray={`${overallPct * 3.27} 327`} strokeLinecap="round"
              transform="rotate(-90 60 60)" className="progress-ring-fill" />
          </svg>
          <div className="progress-ring-text">
            <span className="ring-pct">{overallPct}%</span>
            <span className="ring-label">Complete</span>
          </div>
        </div>
        <div className="progress-stats">
          <div className="pstat"><span className="pstat-val">{readCount}</span><span className="pstat-label">Chapters Read</span></div>
          <div className="pstat"><span className="pstat-val">{quizCount}</span><span className="pstat-label">Quizzes Taken</span></div>
          <div className="pstat"><span className="pstat-val">{total}</span><span className="pstat-label">Total Chapters</span></div>
        </div>
      </div>

      <div className="progress-table">
        <div className="ptable-header">
          <span className="ptable-col-ch">Chapter</span>
          <span className="ptable-col">Read</span>
          <span className="ptable-col">Quiz</span>
          <span className="ptable-col-bar">Progress</span>
        </div>
        {chapters.map(c => {
          const p = progress[c.id] || {};
          const read = p.read ? 1 : 0;
          const quiz = p.quizScore != null ? 1 : 0;
          const pct = ((read + quiz) / 2) * 100;
          return (
            <div key={c.id} className="ptable-row">
              <Link to={`/chapters/${c.id}`} className="ptable-col-ch">
                <span className="ptable-num">{String(c.order).padStart(2, '0')}</span> {c.title}
              </Link>
              <span className="ptable-col">{p.read ? <span className="check green">✓</span> : <span className="check dim">—</span>}</span>
              <span className="ptable-col">
                {p.quizScore != null ? <span className="check green">{Math.round(p.quizScore / p.quizTotal * 100)}%</span> : <span className="check dim">—</span>}
              </span>
              <span className="ptable-col-bar">
                <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${pct}%` }} /></div>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
