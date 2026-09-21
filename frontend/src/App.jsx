import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { TopHeader } from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CareerRadar from './pages/CareerRadar';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import CareerPrediction from './pages/CareerPrediction';
import SkillGap from './pages/SkillGap';
import RecommendedJobs from './pages/RecommendedJobs';
import ApplicationTracker from './pages/ApplicationTracker';
import CodingPractice from './pages/CodingPractice';
import MockTests from './pages/MockTests';
import CodingProgress from './pages/CodingProgress';
import AiraMockInterview from './pages/AiraMockInterview';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import { api, getStoredToken, removeStoredToken } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;
      const path = window.location.pathname.replace(/^\/+/, '').split('/')[0];
      if (path === 'career-radar') return 'career-radar';
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedRoleForGap, setSelectedRoleForGap] = useState('ml-engineer');
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Verify stored session on initial mount
  const checkAuth = async () => {
    setAuthLoading(true);
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setUserProfile(null);
      setAuthLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setUserProfile(data.profile);
        fetchDashboardStats();
      } else {
        removeStoredToken();
        setCurrentUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Failed to verify token:', err);
      setCurrentUser(null);
      setUserProfile(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.profile.get();
      setUserProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await api.dashboard.getStats();
      setDashboardStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  useEffect(() => {
    window.__setCurrentTab = setCurrentTab;
    checkAuth();

    const handleAuthExpired = () => {
      setCurrentUser(null);
      setUserProfile(null);
    };
    window.addEventListener('careerai_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('careerai_auth_expired', handleAuthExpired);
  }, []);

  const handleAuthSuccess = (user, profile) => {
    setCurrentUser(user);
    setUserProfile(profile);
    setCurrentTab('dashboard');
    fetchDashboardStats();
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setUserProfile(null);
    setDashboardStats(null);
    setShowAuthModal(false);
  };

  const handleDataRefresh = () => {
    fetchProfile();
    fetchDashboardStats();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-screen ambient-bg flex items-center justify-center text-slate-400 text-xs select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(56,189,248,0.4)]" />
          <span className="font-semibold text-slate-300">Initializing CareerAI Operating System...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (!showAuthModal) {
      return (
        <LandingPage
          onGetStarted={() => setShowAuthModal(true)}
          setCurrentTab={(tab) => {
            setShowAuthModal(true);
            setCurrentTab(tab);
          }}
        />
      );
    }
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        onBackToLanding={() => setShowAuthModal(false)}
      />
    );
  }

  const getHeaderInfo = () => {
    const firstName = userProfile?.name?.split(' ')[0] || currentUser?.username || 'Candidate';
    switch (currentTab) {
      case 'dashboard':
        return { 
          title: `Hey ${firstName}, I'm CareerAI`, 
          subtitle: "Your personal AI who learns your career style, skills, and goals — so you don't have to repeat yourself." 
        };
      case 'career-radar':
        return {
          title: "Career Radar",
          subtitle: "Multi-source intelligence synthesized across your resume, GitHub, and learning channels."
        };
      case 'profile':
        return { 
          title: "Candidate Profile", 
          subtitle: "Manage your academic credentials, verified skills, target role, and career interests." 
        };
      case 'resume-analyzer':
        return { 
          title: "Resume Intelligence & ATS Analyzer", 
          subtitle: "Upload your resume PDF to extract skills, project history, and calculate ATS compatibility." 
        };
      case 'career-prediction':
        return { 
          title: "Career Predictions", 
          subtitle: "AI predicts your best career directions based on your live technical skills." 
        };
      case 'skill-gap':
        return { 
          title: "Skill Gap Analysis", 
          subtitle: "Benchmark your skills against real industry requirements for target roles." 
        };
      case 'recommended-jobs':
        return { 
          title: "Verified Live Job Matches", 
          subtitle: "Personalized matching against live technology positions across India and Remote." 
        };
      case 'application-tracker':
        return { 
          title: "Application Pipeline Tracker", 
          subtitle: "Manage and track your active job applications in real time." 
        };
      case 'aira-interview':
        return { 
          title: "Aira — AI Mock Interviewer", 
          subtitle: "Interactive voice-driven technical interview coach with live code evaluation." 
        };
      case 'coding-practice':
        return { 
          title: "Coding Practice Workspace", 
          subtitle: "Master data structures, algorithms, and system problems with live code execution." 
        };
      case 'mock-tests':
        return { 
          title: "Technical Mock Assessments", 
          subtitle: "Timed domain assessments to test your technical aptitude." 
        };
      case 'coding-progress':
        return { 
          title: "Assessment & Coding Progress", 
          subtitle: "Track your algorithm mastery, test scores, and personalized recommendations." 
        };
      case 'settings':
        return { 
          title: "Settings & System Telemetry", 
          subtitle: "Manage connected data sources, recommendation preferences, and accounts." 
        };
      default:
        return { 
          title: `Hey ${firstName}, I'm CareerAI`, 
          subtitle: "AI-Powered Career Guidance & Job Matching Platform" 
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen w-screen ambient-bg text-slate-100 overflow-hidden select-none">
      {/* Minimal Vertical Navigation Rail */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-transparent relative">
        {/* Top Ambient Header */}
        <TopHeader
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          userProfile={userProfile}
          onProfileClick={() => setCurrentTab('profile')}
          onSearchClick={() => setCurrentTab('recommended-jobs')}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent custom-scrollbar pb-12">
          {currentTab === 'dashboard' && (
            <Dashboard
              stats={dashboardStats}
              setCurrentTab={setCurrentTab}
              onSelectCareer={(roleId) => {
                setSelectedRoleForGap(roleId);
                setCurrentTab('skill-gap');
              }}
            />
          )}

          {currentTab === 'career-radar' && (
            <CareerRadar
              userProfile={userProfile}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'profile' && (
            <Profile
              userProfile={userProfile}
              onProfileUpdated={(updated) => {
                setUserProfile(updated);
                setCurrentUser(prev => prev ? ({ ...prev, avatar_url: updated.avatar_url, name: updated.name || prev.name }) : prev);
                fetchDashboardStats();
              }}
            />
          )}

          {currentTab === 'resume-analyzer' && (
            <ResumeAnalyzer
              userProfile={userProfile}
              onSkillsExtracted={() => {
                handleDataRefresh();
              }}
            />
          )}

          {currentTab === 'career-prediction' && (
            <CareerPrediction
              userProfile={userProfile}
              setCurrentTab={setCurrentTab}
              onSelectRole={(roleId) => {
                setSelectedRoleForGap(roleId);
              }}
            />
          )}

          {currentTab === 'skill-gap' && (
            <SkillGap
              userProfile={userProfile}
              selectedRole={selectedRoleForGap}
            />
          )}

          {currentTab === 'recommended-jobs' && (
            <RecommendedJobs
              userProfile={userProfile}
              onJobApplied={() => {
                handleDataRefresh();
              }}
            />
          )}

          {currentTab === 'application-tracker' && (
            <ApplicationTracker
              onApplicationChanged={() => {
                handleDataRefresh();
              }}
            />
          )}

          {currentTab === 'aira-interview' && (
            <AiraMockInterview
              userProfile={userProfile}
              onInterviewCompleted={() => {
                handleDataRefresh();
              }}
            />
          )}

          {currentTab === 'coding-practice' && (
            <CodingPractice
              onActionRecorded={() => {
                handleDataRefresh();
              }}
            />
          )}

          {currentTab === 'mock-tests' && (
            <MockTests
              onActionRecorded={() => {
                handleDataRefresh();
              }}
            />
          )}

          {currentTab === 'coding-progress' && (
            <CodingProgress
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'settings' && (
            <Settings onNavigateTab={(tab) => setCurrentTab(tab)} />
          )}
        </main>
      </div>
    </div>
  );
}
