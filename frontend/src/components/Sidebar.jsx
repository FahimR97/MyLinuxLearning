import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getChapters, getProgress } from '../api/client'

export default function Sidebar({ open, collapsed, onClose, onLogout, onToggleCollapse }) {
  const [chapters, setChapters] = useState([])
  const [progress, setProgress] = useState({})
  const [chaptersExpanded, setChaptersExpanded] = useState(true)
  const location = useLocation()

  useEffect(() => {
    getChapters().then(setChapters)
    getProgress().then(setProgress)
  }, [])

  useEffect(() => { onClose() }, [location.pathname])

  const totalChapters = chapters.length || 1
  const readCount = Object.keys(progress).filter(k => progress[k]?.read).length
  const pct = Math.round((readCount / totalChapters) * 100)

  const getChapterStatus = (id) => {
    const p = progress[id] || {}
    if (p.read && p.quizScore != null) return 'done'
    if (p.read || p.quizScore != null) return 'partial'
    return 'none'
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-logo">
            <span className="logo-icon">⌬</span>
            <div className="logo-text-wrap">
              <span className="logo-name">FahimsLinuxLab</span>
              <span className="logo-sub">L4 SysDE Prep</span>
            </div>
          </NavLink>
        </div>

        <div className="sidebar-progress">
          <div className="sidebar-progress-label">
            <span>Progress</span>
            <span>{readCount}/{totalChapters} chapters</span>
          </div>
          <div className="sidebar-progress-bar">
            <div className="sidebar-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-link">
            <span className="nav-icon">⌂</span> Home
          </NavLink>
          <NavLink to="/progress" className="nav-link">
            <span className="nav-icon">◎</span> Progress
          </NavLink>
          <NavLink to="/terminal" className="nav-link">
            <span className="nav-icon">⌨</span> Terminal
          </NavLink>

          <div className="nav-section-label">Content</div>

          <button
            className={`nav-link nav-expand-btn ${chaptersExpanded ? 'expanded' : ''}`}
            onClick={() => setChaptersExpanded(e => !e)}
          >
            <span className="nav-icon">≡</span>
            All Chapters
            <span className="expand-arrow">▸</span>
          </button>

          {chaptersExpanded && (
            <div className="nav-sub">
              <NavLink to="/chapters" end className="nav-sub-link" style={{ paddingLeft: '1.25rem', fontWeight: 600 }}>
                Browse all →
              </NavLink>
              {chapters.map(c => {
                const status = getChapterStatus(c.id)
                return (
                  <div key={c.id} className="nav-chapter-row">
                    <NavLink to={`/chapters/${c.id}`} className="nav-sub-link nav-chapter-link">
                      <span className="chapter-num">{String(c.order).padStart(2, '0')}</span>
                      <span className="nav-chapter-title">{c.title}</span>
                      <span className={`status-dot ${status}`} />
                    </NavLink>
                    <div className="nav-chapter-actions">
                      <NavLink to={`/labs/${c.id}`} className="nav-action-link" title="Labs">⌨️</NavLink>
                      <NavLink to={`/quizzes/${c.id}`} className="nav-action-link" title="Quiz">🧠</NavLink>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? '»' : '«'}
          </button>
          {!collapsed && <>
            <span className="sidebar-version">v2.0</span>
            <button className="sidebar-logout" onClick={onLogout}>logout</button>
          </>}
        </div>
      </aside>
    </>
  )
}
