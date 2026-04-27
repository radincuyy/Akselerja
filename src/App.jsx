import { useState } from 'react';
import { Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import Landing, { NavBar, Footer } from './components/Landing';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import LearningView from './components/LearningView';
import ChatView from './components/ChatView';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import CompanyDashboardView from './components/CompanyDashboardView';
import JobListView from './components/JobListView';
import JobDetailView from './components/JobDetailView';
import PostJobView from './components/PostJobView';

function MainLayout({ children, view, role, onViewChange }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50 animate-fade-in lg:flex-row">
      <Sidebar currentView={view} onViewChange={onViewChange} role={role} />
      <main className="min-h-[100dvh] min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:h-[100dvh] lg:overflow-y-auto lg:p-10">
        <div className="mx-auto w-full max-w-[1120px]">
          {children}
        </div>
      </main>
    </div>
  );
}

function PublicLayout({ children, onNavigate, isAuthenticated, role, onLogout }) {
  return (
    <div className="min-h-screen bg-white font-inter">
      <NavBar onNavigate={onNavigate} isAuthenticated={isAuthenticated} role={role} onLogout={onLogout} />
      <main className="bg-gray-50 py-6 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [role, setRole] = useState('seeker');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const handleAuthComplete = (action, authRole) => {
    setRole(authRole);
    setIsAuthenticated(true);
    if (authRole === 'seeker') {
      navigate('/onboarding');
    } else {
      navigate(authRole === 'company' ? '/company' : '/dashboard');
    }
  };

  const handleJobSelect = (job) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleNavigate = (screen, nextRole) => {
    if (nextRole) setRole(nextRole);
    navigate(`/${screen === 'landing' ? '' : screen}`);
  };

  const handleSidebarChange = (view) => {
    navigate(view === 'landing' ? '/' : `/${view}`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole('seeker');
    navigate('/');
  };

  return (
    <div id="app">
      <Routes>
        <Route
          path="/"
          element={<Landing onNavigate={handleNavigate} isAuthenticated={isAuthenticated} role={role} onLogout={handleLogout} />}
        />
        <Route path="/auth" element={<Auth key={role} role={role} onBack={() => navigate('/')} onComplete={handleAuthComplete} />} />
        <Route path="/onboarding" element={<Onboarding onComplete={() => navigate('/dashboard')} />} />
        
        {/* Public Routes */}
        <Route path="/jobs" element={<PublicLayout onNavigate={handleNavigate} isAuthenticated={isAuthenticated} role={role} onLogout={handleLogout}><JobListView isActive={true} onSelectJob={handleJobSelect} /></PublicLayout>} />
        <Route path="/jobs/detail" element={<Navigate to="/jobs" replace />} />
        <Route path="/jobs/:jobId" element={<PublicLayout onNavigate={handleNavigate} isAuthenticated={isAuthenticated} role={role} onLogout={handleLogout}><JobDetailView isActive={true} onBack={() => navigate('/jobs')} /></PublicLayout>} />
        
        {/* Seeker Dashboard Routes */}
        <Route path="/dashboard" element={<MainLayout view="dashboard" role="seeker" onViewChange={handleSidebarChange}><DashboardView isActive={true} onToLearning={() => navigate('/learning')} /></MainLayout>} />
        <Route path="/learning" element={<MainLayout view="learning" role="seeker" onViewChange={handleSidebarChange}><LearningView isActive={true} /></MainLayout>} />
        <Route path="/chat" element={<MainLayout view="chat" role="seeker" onViewChange={handleSidebarChange}><ChatView isActive={true} /></MainLayout>} />
        
        {/* Company Dashboard Routes */}
        <Route path="/company" element={<MainLayout view="talent-pool" role="company" onViewChange={handleSidebarChange}><CompanyDashboardView isActive={true} onPostJob={() => navigate('/post-job')} /></MainLayout>} />
        <Route path="/talent-pool" element={<MainLayout view="talent-pool" role="company" onViewChange={handleSidebarChange}><CompanyDashboardView isActive={true} onPostJob={() => navigate('/post-job')} /></MainLayout>} />
        <Route path="/post-job" element={<MainLayout view="post-job" role="company" onViewChange={handleSidebarChange}><PostJobView onBack={() => navigate('/talent-pool')} /></MainLayout>} />
      </Routes>
    </div>
  );
}

export default App;
