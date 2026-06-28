import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import HallOfGhosts from './pages/HallOfGhosts';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import PricingPage from './pages/PricingPage';
import ScrollToTop from './components/ScrollToTop';
import PitchDeckAutopsy from './pages/PitchDeckAutopsy.jsx';
import PivotVaultIntro from './components/loaders/PivotVaultIntro';
import PivotVaultLoader from './components/loaders/PivotVaultLoader';
import { LoadingProvider, useLoading } from './context/LoadingContext';

function AppContent() {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const { isLoading, loadingMessage } = useLoading();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('pivotvault_intro_seen');
    console.log('hasSeenIntro:', hasSeenIntro);
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('pivotvault_intro_seen', 'true');
    setShowIntro(false);
  };

  if (showIntro) {
    return <PivotVaultIntro onComplete={handleIntroComplete} />;
  }

  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <>
        {isLoading && <PivotVaultLoader customMessage={loadingMessage} />}
        <ScrollToTop />
        <main className="w-full min-h-screen bg-[#0a0a0f] overflow-x-hidden">
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </main>
      </>
    );
  }

  return (
    <>
      {isLoading && <PivotVaultLoader customMessage={loadingMessage} />}
      <div
        className="pv-app-shell"
        data-sidebar={isCollapsed ? 'collapsed' : 'expanded'}
      >
        <ScrollToTop />
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <div className="pv-app-column">
          <Header />
          <main className="pv-app-main">
            <Routes>
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
              <Route path="/ghosts" element={<HallOfGhosts />} />
              <Route path="/autopsy" element={<ProtectedRoute><PitchDeckAutopsy /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pricing" element={<PricingPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <LoadingProvider>
      <Router>
        <AppContent />
      </Router>
    </LoadingProvider>
  );
}

export default App;
