import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Compass, 
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
  BarChart3,
  Bot,
  User,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, currentUser, onLogout }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard', label: 'AI Assistant', icon: LayoutGrid, tooltip: 'Dashboard' },
    { id: 'profile', label: 'Profile', icon: User, tooltip: 'Candidate Profile' },
    { id: 'career-radar', label: 'Career Radar', icon: Compass, tooltip: 'Career Radar' },
    { id: 'resume-analyzer', label: 'Resume Analyzer', icon: FileText, tooltip: 'Resume' },
    { id: 'skill-gap', label: 'Skill Gap', icon: Zap, tooltip: 'Skill Gap' },
    { id: 'career-prediction', label: 'Career Paths', icon: Target, tooltip: 'Career Predictions' },
    { id: 'recommended-jobs', label: 'Live Jobs', icon: Briefcase, tooltip: 'Live Jobs' },
    { id: 'coding-practice', label: 'Coding Practice', icon: Code2, tooltip: 'Coding Workspace' },
    { id: 'aira-interview', label: 'Aira Interview', icon: Bot, isAira: true, tooltip: 'Aira Mock Interview' },
    { id: 'coding-progress', label: 'Assessment Stats', icon: BarChart3, tooltip: 'Progress & Tests' },
    { id: 'application-tracker', label: 'Tracker', icon: ClipboardList, tooltip: 'Job Applications' },
  ];

  return (
    <>
      {/* Mobile Top Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 rounded-2xl bg-[#0B1024]/90 border border-white/10 text-white flex items-center justify-center backdrop-blur-md shadow-lg cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Rail */}
      <aside 
        className={`
          fixed md:relative top-0 bottom-0 left-0 z-40
          flex flex-col justify-between items-center py-6 px-3
          bg-[#050814]/95 md:bg-[#070A1A]/80 backdrop-blur-2xl
          border-r border-white/10 select-none shrink-0 transition-all duration-300
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
          ${isExpanded ? 'md:w-64 md:items-start' : 'md:w-20 md:items-center'}
        `}
      >
        {/* Top: Glowing Brand Emblem matching Reference Screenshot */}
        <div className="flex items-center gap-3 w-full px-2 mb-8">
          <div 
            onClick={() => {
              setCurrentTab('dashboard');
              setMobileOpen(false);
            }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600/80 via-indigo-500/80 to-blue-500/80 p-[1px] shadow-[0_0_25px_rgba(168,85,247,0.45)] cursor-pointer hover:scale-105 transition-transform shrink-0 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-2xl bg-[#080B1C] flex items-center justify-center">
              {/* Reference Flower / Burst Emblem */}
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
          </div>

          {(isExpanded || mobileOpen) && (
            <div className="min-w-0">
              <span className="text-base font-black text-white tracking-tight font-display block truncate">
                Career<span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">OS v2.0</span>
            </div>
          )}
        </div>

        {/* Center: Minimal Navigation Rail Icons */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-1 overflow-y-auto custom-scrollbar">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <div key={item.id} className="relative group w-full flex items-center">
                <button
                  type="button"
                  data-tab={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3.5 py-3 px-3 rounded-2xl transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'nav-pill-active font-semibold' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'}
                    ${!isExpanded && !mobileOpen ? 'justify-center' : 'justify-start'}
                  `}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : item.isAira ? 'text-pink-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {item.isAira && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)] animate-pulse" />
                    )}
                  </div>

                  {(isExpanded || mobileOpen) && (
                    <span className="text-xs font-semibold truncate tracking-tight">
                      {item.label}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip when Rail is collapsed */}
                {!isExpanded && !mobileOpen && (
                  <div className="hidden md:group-hover:flex absolute left-full ml-3 z-50 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <span>{item.tooltip}</span>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom: Settings & Logout */}
        <div className="pt-4 border-t border-white/10 w-full flex flex-col gap-2 px-1">
          <div className="relative group w-full flex items-center">
            <button
              data-tab="settings"
              onClick={() => {
                setCurrentTab('settings');
                setMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3.5 py-2.5 px-3 rounded-2xl transition-all cursor-pointer
                ${currentTab === 'settings' 
                  ? 'nav-pill-active' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
                ${!isExpanded && !mobileOpen ? 'justify-center' : 'justify-start'}
              `}
              title="Settings"
            >
              <Settings className="w-5 h-5 shrink-0" />
              {(isExpanded || mobileOpen) && (
                <span className="text-xs font-semibold truncate">Settings</span>
              )}
            </button>
            {!isExpanded && !mobileOpen && (
              <div className="hidden md:group-hover:flex absolute left-full ml-3 z-50 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none">
                Settings
              </div>
            )}
          </div>

          <div className="relative group w-full flex items-center">
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center gap-3.5 py-2.5 px-3 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer
                ${!isExpanded && !mobileOpen ? 'justify-center' : 'justify-start'}
              `}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {(isExpanded || mobileOpen) && (
                <span className="text-xs font-semibold truncate">Sign Out</span>
              )}
            </button>
            {!isExpanded && !mobileOpen && (
              <div className="hidden md:group-hover:flex absolute left-full ml-3 z-50 px-3 py-1.5 rounded-xl bg-[#0F172A] text-rose-300 text-xs font-semibold whitespace-nowrap shadow-xl border border-rose-500/20 pointer-events-none">
                Sign Out
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
