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
import { signOut } from './api/auth'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('fll-session'))

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  const handleLogout = () => {
    signOut()
    setAuthed(false)
  }

  return (
    <div className="app-layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="main-content">
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
        </Routes>
      </div>
    </div>
  )
}
