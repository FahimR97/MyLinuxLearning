import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import Home from './pages/Home'
import ChapterList from './pages/ChapterList'
import ChapterDetail from './pages/ChapterDetail'
import LabView from './pages/LabView'
import QuizView from './pages/QuizView'
import ProgressDashboard from './pages/ProgressDashboard'
import LiveTerminal from './pages/LiveTerminal'
import { signOut } from './api/auth'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('fll-session'))

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  const handleLogout = () => {
    signOut()
    setAuthed(false)
  }

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />
      <div className="main-content">
        {sidebarCollapsed && (
          <button
            className="sidebar-expand-float"
            onClick={() => setSidebarCollapsed(false)}
            title="Expand sidebar"
          >»</button>
        )}
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chapters" element={<ChapterList />} />
          <Route path="/chapters/:id" element={<ChapterDetail />} />
          <Route path="/labs/:chapterId" element={<LabView />} />
          <Route path="/quizzes/:chapterId" element={<QuizView />} />
          <Route path="/progress" element={<ProgressDashboard />} />
          <Route path="/terminal" element={<LiveTerminal />} />
        </Routes>
      </div>
    </div>
  )
}
