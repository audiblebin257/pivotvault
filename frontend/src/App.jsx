import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import FailureExplorer from './pages/FailureExplorer';
import PostmortemPage from './pages/PostmortemPage';
import RiskScanner from './pages/RiskScanner';
import KnowledgeGraph from './pages/KnowledgeGraph';
import ConfessionWall from './pages/ConfessionWall';
import InsightsDashboard from './pages/InsightsDashboard';
import AiAssistant from './pages/AiAssistant';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookmarksPage from './pages/BookmarksPage';
import HistoryPage from './pages/HistoryPage';
import FailureQuiz from './pages/FailureQuiz';
import FounderPlaybook from './pages/FounderPlaybook';
import CompareStartups from './pages/CompareStartups';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import PitchDeckAutopsy from './pages/PitchDeckAutopsy.jsx';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <Router>
      <div className="flex min-h-screen bg-bg">
        <ScrollToTop />
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 lg:ml-[260px] min-h-screen transition-all duration-300">
          <div className="pt-16 lg:pt-0"> {/* Mobile header offset */}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore" element={<FailureExplorer />} />
              <Route path="/startup/:slug" element={<PostmortemPage />} />
              <Route path="/scan" element={<ProtectedRoute><RiskScanner /></ProtectedRoute>} />
              <Route path="/graph" element={<KnowledgeGraph />} />
              <Route path="/confessions" element={<ConfessionWall />} />
              <Route path="/insights" element={<InsightsDashboard />} />
              <Route path="/assistant" element={<ProtectedRoute><AiAssistant /></ProtectedRoute>} />
              <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/playbook" element={<ProtectedRoute><FounderPlaybook /></ProtectedRoute>} />
              <Route path="/quiz" element={<FailureQuiz />} />
              <Route path="/compare" element={<CompareStartups />} />
              <Route path="/autopsy" element={<ProtectedRoute><PitchDeckAutopsy /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}


export default App;
