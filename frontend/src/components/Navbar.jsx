import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bell, Search, Check, CheckCheck, Trash2, Zap, Target, FileText, Briefcase, Award, Code, User, AlertCircle, Compass } from 'lucide-react';
import { api } from '../services/api';

export function LandingNavbar({ onGetStarted }) {
  return (
    <header className="w-full max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-extrabold text-white tracking-tight font-display">Career<span className="text-cyan-400">AI</span></span>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#home" className="text-white hover:text-cyan-400 transition-colors">Home</a>
        <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
        <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
        <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={onGetStarted}
          className="btn-glass text-xs cursor-pointer px-4 py-2"
        >
          <span>Sign In</span>
        </button>
        <button
          onClick={onGetStarted}
          className="btn-glow text-xs cursor-pointer px-4 py-2"
        >
          <span>Get Started</span>
        </button>
      </div>
    </header>
  );
}

export function TopHeader({ title, subtitle, userProfile, onProfileClick, onSearchClick = null }) {
  const userName = userProfile?.name || "Candidate";
  const firstName = userName.split(' ')[0] || "there";

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.notifications.list();
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.notifications.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="px-6 sm:px-10 py-5 flex items-center justify-between border-b border-white/5 select-none bg-transparent relative z-30">
      {/* Left: Personalized Warm AI Greeting matching Reference Screenshot */}
      <div className="space-y-1 min-w-0 pr-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display truncate">
          {title ? title : `Hey ${firstName}, I'm CareerAI`}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed truncate max-w-2xl">
          {subtitle ? subtitle : "Your personal AI who learns your career style, skills, and goals — so you don't have to repeat yourself."}
        </p>
      </div>

      {/* Right: Search, Notifications & Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Quick Search Button */}
        <button
          type="button"
          onClick={onSearchClick}
          className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleToggle}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
            )}
          </button>

          {/* Notifications Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-[#090D1F]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                {loading && notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <Sparkles className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-50" />
                    <span>No new notifications. Everything is up to date!</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      className={`p-3.5 hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3 ${!n.is_read ? 'bg-cyan-500/5' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-bold text-white truncate">{n.title}</h5>
                          <span className="text-[10px] text-slate-500 font-mono">{n.time_ago || "Just now"}</span>
                        </div>
                        <p className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar matching Reference Image (circular with glowing border) */}
        <div 
          onClick={onProfileClick}
          className="w-10 h-10 rounded-2xl p-[1px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(56,189,248,0.25)] cursor-pointer hover:scale-105 transition-transform shrink-0"
          title="My Profile"
        >
          <div className="w-full h-full rounded-2xl bg-[#090D1C] overflow-hidden flex items-center justify-center">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-xs font-extrabold text-white uppercase font-display">
                {userName.charAt(0) || "U"}
              </span>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
