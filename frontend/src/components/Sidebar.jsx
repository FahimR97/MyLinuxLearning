import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getChapters } from '../api/client';

export default function Sidebar({ open, onClose }) {
  const [chapters, setChapters] = useState([]);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => { getChapters().then(setChapters); }, []);
  useEffect(() => { onClose(); }, [location.pathname]);

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-logo">
            <span className="logo-icon">⌘</span>
            <span className="logo-text">Linux Lab</span>
          </NavLink>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-link">
            <span className="nav-icon">🏠</span> Home
          </NavLink>
          <button className={`nav-link nav-expand-btn ${chaptersExpanded ? 'expanded' : ''}`} onClick={() => setChaptersExpanded(!chaptersExpanded)}>
            <span className="nav-icon">📖</span> Chapters
            <span className="expand-arrow">{chaptersExpanded ? '▾' : '▸'}</span>
          </button>
          {chaptersExpanded && (
            <div className="nav-sub">
              <NavLink to="/chapters" end className="nav-sub-link">All Chapters</NavLink>
              {chapters.map(c => (
                <NavLink key={c.id} to={`/chapters/${c.id}`} className="nav-sub-link">
                  <span className="chapter-num">{String(c.order).padStart(2, '0')}</span> {c.title}
                </NavLink>
              ))}
            </div>
          )}
          <NavLink to="/progress" className="nav-link">
            <span className="nav-icon">📊</span> Progress
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-version">v1.0 — SysDE Prep</span>
        </div>
      </aside>
    </>
  );
}
