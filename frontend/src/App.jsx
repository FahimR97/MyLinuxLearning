import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ChapterList from './pages/ChapterList';
import ChapterDetail from './pages/ChapterDetail';
import LabView from './pages/LabView';
import QuizView from './pages/QuizView';
import ProgressDashboard from './pages/ProgressDashboard';
import { useState } from 'react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
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
  );
}
