import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bell, ChevronDown, Check, CheckCheck, Trash2, Zap, Target, FileText, Briefcase, Award, Code, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export function LandingNavbar({ onGetStarted }) {
  return (
    <header className="w-full max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-extrabold text-white tracking-tight font-display">Career<span className="text-purple-400">AI</span></span>
      </div>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#home" className="text-white hover:text-purple-400 transition-colors">Home</a>
        <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
        <a href="#about" className="hover:text-purple-400 transition-colors">About</a>
        <a href="#how-it-works" className="hover:text-purple-400 transition-colors">How It Works</a>
        <a href="#contact" className="hover:text-purple-400 transition-colors">Contact</a>
      </nav>

      {/* CTA Button */}
      <div>
        <button
          onClick={onGetStarted}
          className="h-10 px-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-700/30 hover:shadow-purple-700/50 hover:scale-[1.02] transition-all cursor-pointer inline-flex items-center justify-center"
        >
          Get Started
        </button>
      </div>
    </header>
  );
}

export function TopHeader({ title, subtitle, userProfile, onProfileClick }) {
  const userName = userProfile?.name || "Job Seeker";
  const displayTitle = title || `Welcome back, ${userName.split(' ')[0]}! 👋`;
  const displaySubtitle = subtitle || "Here's your real-time career overview";

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
    const interval = setInterval(fetchNotifications, 15000); // refresh periodically
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
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
      await api.notifications.clear();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (iconType) => {
    switch (iconType) {
      case 'zap': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'target': return <Target className="w-4 h-4 text-purple-500" />;
      case 'file': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'briefcase': return <Briefcase className="w-4 h-4 text-emerald-500" />;
      case 'check': return <Check className="w-4 h-4 text-teal-500" />;
      case 'code': return <Code className="w-4 h-4 text-indigo-500" />;
      case 'user': return <User className="w-4 h-4 text-purple-600" />;
      default: return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };
  
  return (
    <header className="w-full h-16 px-8 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-2xs">
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">{displayTitle}</h1>
        <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">{displaySubtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleToggle}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold tracking-tight">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/40 text-indigo-200 rounded-full border border-indigo-400/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Read all</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAll}
                      className="text-[11px] text-slate-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1 font-medium ml-1"
                      title="Clear all notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-2">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                      Actions like profile updates, resume analysis, and applications will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                        notif.is_read ? 'opacity-70 bg-white' : 'bg-indigo-50/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(notif.icon_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold truncate ${notif.is_read ? 'text-slate-800' : 'text-indigo-950 font-bold'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                            {notif.time_ago || "Just now"}
                          </span>
                        </div>
                        {notif.message && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        )}
                      </div>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5 ring-2 ring-indigo-100" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div 
          onClick={onProfileClick}
          className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
        >
          {userProfile?.avatar_url ? (
            <img 
              src={userProfile.avatar_url} 
              alt={userName} 
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shadow-sm shrink-0" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center ring-1 ring-slate-200 shadow-sm shrink-0 uppercase">
              {userName ? userName.charAt(0) : 'U'}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-800">{userName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>
    </header>
  );
}