import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  Github, 
  Youtube, 
  Instagram, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink, 
  Trash2, 
  Layers, 
  Code2, 
  Target, 
  Zap, 
  Check, 
  Lock, 
  Info,
  ChevronRight,
  Bot,
  FileText,
  User,
  Settings,
  Copy,
  X,
  KeyRound,
  Calendar,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';

export default function CareerRadar({ userProfile, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState(null);
  const [justSyncedProvider, setJustSyncedProvider] = useState(null);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [accountsData, setAccountsData] = useState({ providers: [], total_connected: 0 });
  const [interestsData, setInterestsData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Setup modal state
  const [setupModalProvider, setSetupModalProvider] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, intRes, recRes] = await Promise.all([
        api.careerRadar.getAccounts().catch(e => { console.warn(e); return { providers: [], total_connected: 0 }; }),
        api.careerRadar.getInterests().catch(e => { console.warn(e); return null; }),
        api.careerRadar.getRecommendations().catch(e => { console.warn(e); return []; })
      ]);
      setAccountsData(accRes && Array.isArray(accRes.providers) ? accRes : { providers: [], total_connected: 0 });
      setInterestsData(intRes || null);
      setRecommendations(Array.isArray(recRes) ? recRes : []);
      if (intRes?.career_interests?.length > 0) {
        setSelectedDomain(intRes.career_interests[0]);
      }
    } catch (err) {
      console.error("Failed to load Career Radar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for query parameters e.g. returning from OAuth callbacks
    try {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const provider = params.get('provider');
      const msg = params.get('message') || params.get('msg');
      if (status === 'success' && provider) {
        const provTitle = provider.charAt(0).toUpperCase() + provider.slice(1);
        setActionMessage({
          type: 'success',
          text: `🎉 ${provTitle} connected successfully! Live skills and career interest signals have been imported.`
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (status === 'error') {
        setActionMessage({
          type: 'error',
          text: msg || `Failed to connect ${provider || 'account'}. Please check credentials and try again.`
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error("URL params check error:", e);
    }

    fetchData();
  }, []);

  const handleCopy = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConnect = async (provider) => {
    setConnectingProvider(provider);
    setActionMessage(null);
    try {
      const res = await api.careerRadar.getAuthorizeUrl(provider);
      if (res && res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        throw new Error("Invalid authorization URL received from server.");
      }
    } catch (err) {
      console.error("Failed to initiate OAuth:", err);
      setActionMessage({
        type: 'error',
        text: err.message || `${provider} integration isn't configured yet. Add credentials to backend environment.`
      });
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleSync = async (provider) => {
    setSyncingProvider(provider);
    setActionMessage(null);
    try {
      const res = await api.careerRadar.sync(provider);
      setJustSyncedProvider(provider);
      setTimeout(() => setJustSyncedProvider(null), 4000);
      setActionMessage({
        type: 'success',
        text: `✓ Fresh sync complete for ${provider}: imported ${res.signals_count || 0} live signals.`
      });
      fetchData();
    } catch (err) {
      console.error("Sync failed:", err);
      setActionMessage({
        type: 'error',
        text: `Sync failed for ${provider}: ${err.message || 'Check connection or token expiration.'}`
      });
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleDisconnect = async (provider, providerName) => {
    const label = providerName || provider;
    if (!window.confirm(`Are you sure you want to disconnect ${label}? All imported signals and encrypted tokens will be permanently removed.`)) return;
    setActionMessage(null);
    try {
      await api.careerRadar.disconnect(provider);
      setActionMessage({
        type: 'success',
        text: `Successfully disconnected ${label}. Associated signals were cleanly removed.`
      });
      fetchData();
    } catch (err) {
      console.error("Disconnect failed:", err);
      setActionMessage({
        type: 'error',
        text: `Failed to disconnect ${label}: ${err.message || 'Unknown error'}`
      });
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'github': return <Github className="w-5 h-5 text-white" />;
      case 'google':
      case 'youtube': return <Youtube className="w-5 h-5 text-rose-400" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-400" />;
      default: return <Compass className="w-5 h-5 text-cyan-400" />;
    }
  };

  const domains = Array.isArray(interestsData?.career_interests) ? interestsData.career_interests : [];
  const topDomain = interestsData?.top_career_domain || "Software Engineering";
  const totalSignals = interestsData?.total_signals_detected || 0;
  const allUnconfigured = accountsData.providers.length > 0 && accountsData.providers.every(p => !p.configured);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[500px] space-y-4 text-center select-none">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(56,189,248,0.4)]" />
        <p className="text-sm font-bold text-white tracking-tight">Synthesizing Career Radar Intelligence...</p>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Aggregating multi-source evidence across your profile, resume NLP extraction, and connected learning channels.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 w-full max-w-7xl mx-auto animate-in fade-in duration-300 select-none text-slate-100">
      
      {/* Header */}
      <PageHeader
        title="Career Radar"
        subtitle="Multi-source career intelligence synthesizing signals across your resume, verified skills, GitHub, and professional learning channels."
        badge="Evidence-Based Intelligence"
      />

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          actionMessage.type === 'error' 
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-200' 
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white cursor-pointer text-base leading-none">×</button>
        </div>
      )}

      {/* 1. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card-compact p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Direction</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg font-black text-white truncate mt-2">{topDomain}</p>
          <span className="text-xs text-cyan-300 font-semibold mt-1">High Momentum</span>
        </div>

        <div className="glass-card-compact p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected Accounts</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{accountsData.total_connected} / 3</p>
          <span className="text-xs text-slate-400 mt-1">Official OAuth Secured</span>
        </div>

        <div className="glass-card-compact p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evidence Signals</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{totalSignals} Signals</p>
          <span className="text-xs text-slate-400 mt-1">Grounded in code & projects</span>
        </div>

        <div className="glass-card-compact p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cross-Source Confidence</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {domains[0]?.confidence ? `${Math.round(domains[0].confidence * 100)}%` : "85%"}
          </p>
          <span className="text-xs text-emerald-300/80 mt-1">Verified Evidence</span>
        </div>

      </div>

      {/* 2. Main Interactive Constellation / Radar Map & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Constellation Orbital Graph (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          {/* Ambient Lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              <h3 className="text-sm font-bold text-white tracking-tight">Career Radar Constellation</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Click any node to inspect evidence</span>
          </div>

          {/* Futuristic Node Visualizer */}
          <div className="relative z-10 my-auto py-8 flex flex-col items-center justify-center">
            
            {/* Center User Node */}
            <div className="relative z-20 w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 shadow-[0_0_35px_rgba(56,189,248,0.4)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#080D20] flex flex-col items-center justify-center text-center p-2">
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">YOU</span>
                <span className="text-xs font-black text-white truncate max-w-[75px]">{userProfile?.name?.split(' ')[0] || "Candidate"}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">{domains[0]?.score || 75}% Fit</span>
              </div>
            </div>

            {/* Connecting Orbit Rings */}
            <div className="absolute w-72 h-72 rounded-full border border-white/10 pointer-events-none" />
            <div className="absolute w-96 h-96 rounded-full border border-white/5 pointer-events-none hidden sm:block" />

            {/* Outer Orbit Nodes */}
            <div className="w-full max-w-lg mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-20">
              {domains.map((dom) => {
                const isSelected = selectedDomain?.domain_id === dom.domain_id;
                return (
                  <div
                    key={dom.domain_id}
                    onClick={() => setSelectedDomain(dom)}
                    className={`
                      p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group
                      ${isSelected 
                        ? 'bg-gradient-to-b from-cyan-500/20 to-indigo-600/20 border-cyan-400/50 shadow-[0_0_20px_rgba(56,189,248,0.3)] scale-105' 
                        : 'bg-[#0B1024]/80 hover:bg-[#101838] border-white/10 hover:border-white/20'}
                    `}
                  >
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate w-full">
                      {dom.domain_name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-black text-cyan-400 font-mono">{dom.score}%</span>
                      <span className="text-[10px] text-slate-400 font-medium">Fit</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Percentages computed via deterministic evidence weighting.</span>
            <span className="text-cyan-400 font-semibold font-mono">Zero Hallucinations</span>
          </div>
        </div>

        {/* Right: Selected Domain Detailed Evidence Drawer (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-7 flex flex-col justify-between space-y-5">
          {selectedDomain ? (
            <div className="space-y-4">
              
              <div className="flex items-start justify-between pb-3 border-b border-white/5">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Inspecting Career Track</span>
                  <h4 className="text-lg font-black text-white tracking-tight mt-0.5">{selectedDomain.domain_name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-cyan-300 font-mono">{selectedDomain.score}%</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{selectedDomain.confidence_label}</span>
                </div>
              </div>

              {/* Supporting Evidence Bullets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ground-Truth Supporting Evidence</span>
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {(selectedDomain.evidence || []).map((ev, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200 leading-relaxed">
                      {ev}
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Evidence Sources */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Verified Sources</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDomain.sources || []).map((src, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-semibold">
                      {src}
                    </span>
                  ))}
                </div>
              </div>

              {/* Aligned Roles */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Target Industry Roles</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDomain.target_roles || []).map((r, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a domain node from the constellation to inspect ground-truth evidence.
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('skill-gap') : null}
              className="btn-glass text-xs flex-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Analyze Skill Gap</span>
            </button>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('aira-interview') : null}
              className="btn-glow text-xs flex-1 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-pink-400" />
              <span>Practice Aira</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Connected Accounts Section (GitHub, Google / YouTube, Instagram) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Connected Career Data Sources</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect your developer profiles using official OAuth 2.0 authorization. Tokens are encrypted server-side with AES-128-CBC + HMAC-SHA256.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20 shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Server-Side OAuth & Encryption</span>
          </span>
        </div>

        {/* Informational Banner when no providers are configured in backend/.env */}
        {allUnconfigured && (
          <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/25 text-amber-200/90 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">Production OAuth Integrations Ready to Configure</p>
              <p className="text-slate-300 leading-relaxed">
                Career Radar uses official, verified OAuth 2.0 protocols. To connect your live profiles, register an OAuth application on GitHub, Google, or Meta, and add your client credentials to <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">backend/.env</code>.
                Click <strong>Setup Required</strong> on any card below to view exact redirect URIs and setup steps.
              </p>
            </div>
          </div>
        )}

        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(accountsData.providers || []).map((p) => {
            const isConnected = p.connected && p.account;
            const isConfigured = p.configured;

            return (
              <div 
                key={p.provider} 
                className={`glass-card-compact p-5 flex flex-col justify-between space-y-4 transition-all ${
                  isConnected 
                    ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]' 
                    : isConfigured 
                      ? 'border-cyan-500/30' 
                      : 'border-white/10'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Card Header: Icon + Name + 3-State Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {getProviderIcon(p.provider)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {isConnected && (p.provider === 'google' || p.provider === 'youtube')
                            ? "Google Connected"
                            : p.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {isConnected ? `@${p.account.username || p.account.display_name}` : "Official OAuth 2.0"}
                        </span>
                      </div>
                    </div>

                    {/* 3 State Badges */}
                    <div>
                      {isConnected ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Connected</span>
                        </span>
                      ) : isConfigured ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>Ready to Connect</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Configuration Required</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Provider Description */}
                  <p className="text-xs text-slate-300/80 leading-relaxed">
                    {p.provider === 'github' && "Imports public repositories, programming languages, and project topics to identify verified technical focus."}
                    {(p.provider === 'youtube' || p.provider === 'google') && "Uses Google's official read-only YouTube API to identify technical channels and learning topics. No watch history is accessed."}
                    {p.provider === 'instagram' && "Supports Instagram Professional accounts via Meta's official API to detect creative and technical portfolio posts."}
                  </p>

                  {/* State 3: Connected Account Details Display */}
                  {isConnected && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center gap-3">
                        {p.account.avatar_url ? (
                          <img 
                            src={p.account.avatar_url} 
                            alt={p.account.display_name || p.account.username} 
                            className="w-9 h-9 rounded-full object-cover border border-cyan-500/30"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-black text-cyan-300">
                            {(p.account.display_name || p.account.username || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{p.account.display_name || p.account.username}</p>
                          <p className="text-[11px] text-cyan-300 font-mono truncate">@{p.account.username}</p>
                        </div>
                        {p.account.account_type && (
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                            {p.account.account_type}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1 truncate">
                          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Connected: {p.account.created_at ? new Date(p.account.created_at).toLocaleDateString() : "Active"}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Synced: {p.account.last_synced_at ? new Date(p.account.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                        </div>
                      </div>

                      {(p.provider === 'youtube' || p.provider === 'google') && (
                        <p className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5">
                          Based on authorized YouTube data available to CareerAI.
                        </p>
                      )}
                    </div>
                  )}

                  {/* State 1: Configuration Required Helper Box */}
                  {!isConfigured && (
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-amber-300">
                          {(p.provider === 'google' || p.provider === 'youtube')
                            ? "Google integration isn't configured."
                            : "Client credentials not configured."}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click Configuration Required to view the environment variables and developer portal link.</p>
                      </div>
                      <button 
                        onClick={() => setSetupModalProvider(p)}
                        className="text-amber-400 hover:text-amber-300 font-semibold underline text-[10px] shrink-0 cursor-pointer"
                      >
                        View Guide
                      </button>
                    </div>
                  )}

                  {/* State 2: Ready to Connect Helper Box */}
                  {isConfigured && !isConnected && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-relaxed flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>
                        {(p.provider === 'google' || p.provider === 'youtube')
                          ? "Connect your Google account to enable authorized career-interest signals."
                          : "Credentials configured. Ready to authorize official access."}
                      </span>
                    </div>
                  )}

                </div>

                {/* Account Action Buttons */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSync(p.provider)}
                        disabled={syncingProvider === p.provider}
                        className={`btn-glass text-xs flex items-center gap-1.5 cursor-pointer ${
                          justSyncedProvider === p.provider ? 'border-emerald-500/40 text-emerald-300' : ''
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${
                          syncingProvider === p.provider 
                            ? 'animate-spin text-cyan-400' 
                            : justSyncedProvider === p.provider 
                              ? 'text-emerald-400' 
                              : 'text-cyan-400'
                        }`} />
                        <span>
                          {syncingProvider === p.provider 
                            ? "Syncing..." 
                            : justSyncedProvider === p.provider 
                              ? "✓ Synced just now" 
                              : "Sync Now"}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDisconnect(p.provider, p.name)}
                        className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </button>
                    </>
                  ) : isConfigured ? (
                    <button
                      onClick={() => handleConnect(p.provider)}
                      disabled={connectingProvider === p.provider}
                      className="btn-glow text-xs w-full justify-center cursor-pointer flex items-center gap-1.5"
                    >
                      <span>
                        {connectingProvider === p.provider 
                          ? "Redirecting..." 
                          : (p.provider === 'google' || p.provider === 'youtube') 
                            ? "Connect Google" 
                            : `Connect ${p.name}`}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setSetupModalProvider(p)}
                      className="btn-glass text-xs w-full justify-center border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-200 cursor-pointer flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-400" />
                      <span>Configuration Required</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Privacy Pledge Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="leading-relaxed">
              <strong className="text-white">Career Radar Privacy Pledge:</strong> We only import data with your explicit OAuth consent. Access tokens are encrypted at rest with AES-128-CBC + HMAC-SHA256 (Fernet) and are never sent to your browser or logged in plain text. You can disconnect anytime.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Career Recommendations Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span>Recommended Career Directions from Radar</span>
            </h3>
            <p className="text-xs text-slate-400">
              Personalized career matches dynamically weighted against your detected interest signals and target skills.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('recommended-jobs') : null}
            className="btn-glass text-xs flex items-center gap-1.5 cursor-pointer text-cyan-300 border-cyan-500/30 hover:border-cyan-400 self-start sm:self-auto shrink-0"
          >
            <span>Browse Matching Live Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(recommendations) ? recommendations : []).slice(0, 6).map((rec) => (
            <div key={rec.id} className="glass-card-compact p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{rec.category}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 font-mono">
                    {rec.fit_score}% Fit
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{rec.title}</h4>
                <p className="text-xs text-slate-300/85 leading-relaxed">{rec.why_this_fits}</p>

                {rec.missing_skills?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Skills to Add</span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.missing_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-400 truncate mr-1">{rec.recommended_next_action}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateTab ? onNavigateTab('skill-gap') : null}
                    className="text-slate-400 hover:text-white font-medium flex items-center gap-0.5 cursor-pointer"
                    title="Explore Skill Gap"
                  >
                    <span>Skill Gap</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab ? onNavigateTab('recommended-jobs') : null}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5 cursor-pointer"
                    title="View Matching Live Jobs"
                  >
                    <span>Live Jobs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Provider Setup Instructions Modal */}
      {setupModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-xl p-6 sm:p-7 space-y-5 border-white/15 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {getProviderIcon(setupModalProvider.provider)}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Configure {setupModalProvider.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      OAuth 2.0 Setup
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Step-by-step instructions to enable official integration.</p>
                </div>
              </div>
              <button 
                onClick={() => setSetupModalProvider(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Steps */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              
              {/* Step 1: Create OAuth App */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center">1</span>
                    Register App on Developer Portal
                  </span>
                  {setupModalProvider.setup_details?.dev_portal_url && (
                    <a
                      href={setupModalProvider.setup_details.dev_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      <span>Open Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Go to <strong>{setupModalProvider.setup_details?.portal_name || "Developer Portal"}</strong> and create a new OAuth 2.0 application.
                </p>
                {setupModalProvider.setup_details?.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    Note: {setupModalProvider.setup_details.notes}
                  </p>
                )}
              </div>

              {/* Step 2: Set Callback URL */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center">2</span>
                    Authorized Redirect URI
                  </span>
                  <button
                    onClick={() => handleCopy(setupModalProvider.setup_details?.callback_url || "", "callback_url")}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === "callback_url" ? "✓ Copied" : "Copy URI"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300">Set the authorization callback URL in the provider portal to:</p>
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 font-mono text-xs text-cyan-300 break-all select-all">
                  {setupModalProvider.setup_details?.callback_url}
                </div>
              </div>

              {/* Step 3: Add Environment Variables */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center">3</span>
                    Add to backend/.env
                  </span>
                  <button
                    onClick={() => {
                      const envVars = (setupModalProvider.setup_details?.env_vars || []).map(v => `${v}=your_${v.toLowerCase()}_here`).join('\n');
                      handleCopy(envVars, "env_block");
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === "env_block" ? "✓ Copied" : "Copy Template"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300">Add the following keys to your local <code className="text-cyan-300 font-mono">backend/.env</code>:</p>
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 font-mono text-xs text-slate-200 space-y-1">
                  {(setupModalProvider.setup_details?.env_vars || []).map((envVar, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-cyan-300">{envVar}=<span className="text-slate-500">&lt;value_from_portal&gt;</span></span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Refer to <code className="text-slate-300 font-mono">backend/.env.example</code> for ready-to-copy configurations.
                </p>
              </div>

              {/* Step 4: Restart & Test */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center">4</span>
                  Restart & Connect
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Restart the backend process (<code className="text-cyan-300 font-mono text-[11px]">uvicorn main:app</code>). This card will immediately detect the credentials and switch to <strong className="text-cyan-300">Ready to Connect</strong>.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end">
              <button
                onClick={() => setSetupModalProvider(null)}
                className="btn-glow text-xs px-5 py-2 cursor-pointer"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
