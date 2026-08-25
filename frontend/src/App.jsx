import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { TopHeader } from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import CareerPrediction from './pages/CareerPrediction';
import SkillGap from './pages/SkillGap';
import RecommendedJobs from './pages/RecommendedJobs';
import ApplicationTracker from './pages/ApplicationTracker';
import CodingPractice from './pages/CodingPractice';
import MockTests from './pages/MockTests';
import CodingProgress from './pages/CodingProgress';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import { api, getStoredToken, removeStoredToken } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedRoleForGap, setSelectedRoleForGap] = useState('ml-engineer');
  const [authLoading, setAuthLoading] = useState(true);

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
  };

  const handleDataRefresh = () => {
    fetchProfile();
    fetchDashboardStats();
  };

  // If loading auth verification
  if (authLoading) {
    return (
      <div className="min-h-screen w-screen bg-[#090D16] flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-300">Initializing CareerAI session...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated, show Auth Page (Login / Sign Up)
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Header Title and Subtitle synchronization
  const getHeaderInfo = () => {
    const firstName = currentUser?.username || 'Seeker';
    switch (currentTab) {
      case 'dashboard':
        return { 
          title: `Welcome back, ${firstName}! 👋`, 
          subtitle: "Here's your live career intelligence overview" 
        };
      case 'profile':
        return { 
          title: "My Profile", 
          subtitle: "Manage your academic credentials, verified skills, target role, and career interests." 
        };
      case 'resume-analyzer':
        return { 
          title: "Resume Analyzer", 
          subtitle: "Upload your resume and let AI extract your skills and experience." 
        };
      case 'career-prediction':
        return { 
          title: "Career Predictions", 
          subtitle: "AI predicts the best career paths for you based on your live profile." 
        };
      case 'skill-gap':
        return { 
          title: "Skill Gap Analysis", 
          subtitle: "Detailed comparison between your skills and industry requirements for target roles." 
        };
      case 'recommended-jobs':
        return { 
          title: "Recommended Jobs", 
          subtitle: "Personalized matching against 375+ active technology positions." 
        };
      case 'application-tracker':
        return { 
          title: "Application Tracker", 
          subtitle: "Track and manage your actual job applications in real time." 
        };
      case 'coding-practice':
        return { 
          title: "Coding Practice", 
          subtitle: "Master data structures, algorithms, and system problems with live code execution." 
        };
      case 'mock-tests':
        return { 
          title: "Technical Mock Assessments", 
          subtitle: "Timed assessments to evaluate your readiness across domains." 
        };
      case 'coding-progress':
        return { 
          title: "Coding & Assessment Progress", 
          subtitle: "Track your algorithm mastery, mock test scores, and personalized recommendations." 
        };
      case 'settings':
        return { 
          title: "Settings & Configuration", 
          subtitle: "Manage account details and platform preferences." 
        };
      default:
        return { 
          title: "CareerAI", 
          subtitle: "AI-Powered Career Guidance & Job Matching Platform" 
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-900 overflow-hidden select-none">
      {/* Fixed Left Dark Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <TopHeader
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          userProfile={userProfile}
          onProfileClick={() => setCurrentTab('profile')}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
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
            <Settings />
          )}
        </main>
      </div>
    </div>
  );
}