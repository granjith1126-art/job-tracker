import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Target, 
  Zap, 
  Briefcase, 
  ClipboardList, 
  Settings, 
  LogOut,
  Sparkles,
  Code2,
  FileCheck2,
  BarChart3
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, currentUser, onLogout }) {
  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'resume-analyzer', label: 'Resume Analyzer', icon: FileText },
    { id: 'career-prediction', label: 'Career Prediction', icon: Target },
    { id: 'skill-gap', label: 'Skill Gap', icon: Zap },
    { id: 'recommended-jobs', label: 'Recommended Jobs', icon: Briefcase },
    { id: 'application-tracker', label: 'Application Tracker', icon: ClipboardList },
  ];

  const practiceMenuItems = [
    { id: 'coding-practice', label: 'Coding Practice', icon: Code2 },
    { id: 'mock-tests', label: 'Mock Assessments', icon: FileCheck2 },
    { id: 'coding-progress', label: 'Coding Progress', icon: BarChart3 },
  ];

  const bottomMenuItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#0B0F19] border-r border-[#1E2638] flex flex-col justify-between p-4 select-none shrink-0 z-30">
      {/* Brand Header & Menu Groups */}
      <div className="overflow-y-auto custom-scrollbar pr-1">
        <div 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center gap-2.5 px-3 py-3 mb-5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-900/40 group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight font-display">Career<span className="text-indigo-400">AI</span></span>
        </div>

        {/* Career & Tracking Group */}
        <div className="mb-4">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Career Platform
          </span>
          <nav className="space-y-0.5">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`sidebar-item w-full text-left cursor-pointer ${isActive ? 'active' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Practice & Skill Building Group */}
        <div className="mb-4">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Practice & Tests
          </span>
          <nav className="space-y-0.5">
            {practiceMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`sidebar-item w-full text-left cursor-pointer ${isActive ? 'active' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account & Settings Group */}
        <div className="mb-2">
          <nav className="space-y-0.5">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`sidebar-item w-full text-left cursor-pointer ${isActive ? 'active' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: User Info & Logout */}
      <div className="pt-3 border-t border-[#1E2638] space-y-2 shrink-0">
        {currentUser && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
            {currentUser.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.username} 
                className="w-8 h-8 rounded-lg object-cover border border-indigo-500/40 shrink-0" 
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase shrink-0">
                {currentUser.username ? currentUser.username.charAt(0) : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.email || 'Online'}</p>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="sidebar-item w-full text-left text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}