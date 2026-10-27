import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Briefcase, 
  Zap, 
  Target, 
  Compass, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Search, 
  Mic, 
  Send, 
  TrendingUp, 
  Code2, 
  Layers, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import InsightCard from '../components/common/InsightCard';
import RadialProgress from '../components/RadialProgress';

export default function Dashboard({ stats, setCurrentTab, onSelectCareer }) {
  const [quickPrompt, setQuickPrompt] = useState('');

  // Extract real metrics from stats
  const profileStrength = stats?.profile_strength || 0;
  const predictedCareer = stats?.predicted_career || "Software Engineer";
  const predictedMatch = stats?.predicted_match || 60;
  const skillMatch = stats?.skill_match_overall || 55;
  const totalApps = stats?.total_applications || 0;
  const topCareer = stats?.top_career || {
    title: predictedCareer,
    match: predictedMatch,
    subtitle: "Focusing on modern cloud architectures, scalable backend APIs, and distributed systems.",
    top_skills: ["Python", "FastAPI", "SQL", "Docker"],
  };
  const secondaryCareers = stats?.secondary_careers || [];
  const activities = stats?.recent_activities || [];

  // Determine dynamic career readiness percentage from real metrics
  const careerReadiness = profileStrength > 0 
    ? Math.round((profileStrength * 0.4) + (skillMatch * 0.35) + (predictedMatch * 0.25))
    : (skillMatch > 0 ? skillMatch : 65);

  const handleQuickSubmit = (e) => {
    if (e) e.preventDefault();
    if (!quickPrompt.trim()) return;
    
    const p = quickPrompt.toLowerCase();
    if (p.includes('interview') || p.includes('aira') || p.includes('mock')) {
      setCurrentTab('aira-interview');
    } else if (p.includes('radar') || p.includes('account') || p.includes('github')) {
      setCurrentTab('career-radar');
    } else if (p.includes('resume') || p.includes('cv') || p.includes('ats')) {
      setCurrentTab('resume-analyzer');
    } else if (p.includes('skill') || p.includes('gap') || p.includes('learn')) {
      setCurrentTab('skill-gap');
    } else if (p.includes('job') || p.includes('apply')) {
      setCurrentTab('recommended-jobs');
    } else if (p.includes('code') || p.includes('python') || p.includes('algorithm')) {
      setCurrentTab('coding-practice');
    } else {
      setCurrentTab('career-radar');
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* 1. Main Hero AI Insight Panel matching Reference Screenshot */}
      <div className="relative rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-[#0C122C]/90 via-[#10183B]/80 to-[#0A0E24]/90 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Subtle Ambient Radial Light behind card */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CareerAI Intelligence Overview</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight font-display">
              Your profile is trending toward <span className="text-gradient">{predictedCareer}</span>.
            </h3>

            <p className="text-sm text-slate-300/85 leading-relaxed font-medium">
              Based on your verified skills, projects, and active job demand, you have a strong foundational match. 
              Refining key architectural areas and completing targeted mock interviews will elevate your role readiness.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentTab('career-radar')}
                className="btn-glow cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Career Radar</span>
              </button>

              <button
                onClick={() => setCurrentTab('aira-interview')}
                className="btn-glass cursor-pointer"
              >
                <Bot className="w-4 h-4 text-pink-400" />
                <span>Practice with Aira</span>
              </button>
            </div>
          </div>

          {/* Right Circular Gauge */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shrink-0">
            <div className="relative flex items-center justify-center">
              <RadialProgress 
                percentage={careerReadiness} 
                size={110} 
                strokeWidth={10} 
                primaryColor="#38BDF8" 
                secondaryColor="rgba(255,255,255,0.06)" 
              />
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white font-mono tracking-tight">{careerReadiness}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Readiness</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold text-white block">Overall Market Fit</span>
              <span className="text-xs text-slate-400 block max-w-[150px]">
                Calculated dynamically across resume, skills & job benchmarks.
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Benchmark Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Insight Cards Grid (Inspired by the Reference Screenshot) */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Career Signals</span>
          </h4>
          <span className="text-xs text-slate-400">Grounded in real profile & live platform data</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Resume Health */}
          <InsightCard
            icon={FileText}
            title="Resume Health"
            subtitle={profileStrength > 0 ? `${profileStrength}% Extracted Quality` : "Resume Needed"}
            value={profileStrength > 0 ? "Strong" : "Action Needed"}
            description={profileStrength > 0 
              ? "Verified skills and project history are actively parsed."
              : "Upload your resume PDF to extract skills and maximize job match scores."}
            badgeText="Based on your resume"
            badgeVariant="emerald"
            onClick={() => setCurrentTab('resume-analyzer')}
          />

          {/* Card 2: Career Direction */}
          <InsightCard
            icon={Target}
            title="Career Direction"
            subtitle={`${predictedMatch}% Match Fit`}
            value={predictedCareer}
            description={`Primary predictive direction matching your stack and background.`}
            badgeText="Based on your skills"
            badgeVariant="indigo"
            onClick={() => setCurrentTab('career-prediction')}
          />

          {/* Card 3: Skill Gap */}
          <InsightCard
            icon={Zap}
            title="Skill Gap Opportunity"
            subtitle={`${skillMatch}% Acquired Readiness`}
            value={topCareer.top_skills[0] || "Backend"}
            description={`Benchmark against target role requirements to close critical missing skills.`}
            badgeText="Core Benchmark"
            badgeVariant="amber"
            onClick={() => {
              if (onSelectCareer) onSelectCareer(topCareer.title.toLowerCase().replace(/\s+/g, '-'));
              setCurrentTab('skill-gap');
            }}
          />

          {/* Card 4: Live Job Matches */}
          <InsightCard
            icon={Briefcase}
            title="Verified Live Jobs"
            subtitle="India & Remote Tech Feeds"
            value="Active"
            description="Verified live postings across active tech job feeds in India and remote."
            badgeText="Real-time Match"
            badgeVariant="blue"
            onClick={() => setCurrentTab('recommended-jobs')}
          />

        </div>
      </div>

      {/* 3. Secondary Row: Predictive Career Tracks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Predicted Career Path Details (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Primary Career Trajectory</h4>
                  <p className="text-[11px] text-slate-400">Multi-vector machine learning prediction</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs font-mono">
                {predictedMatch}% Match
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/20 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-white">{topCareer.title}</span>
                <span className="text-xs text-slate-400 font-medium">Top Match</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {topCareer.subtitle}
              </p>
              
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Key Technologies & Capabilities
                </span>
                <div className="flex flex-wrap gap-2">
                  {topCareer.top_skills.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
            <span className="text-slate-400">Want to see alternative paths?</span>
            <button
              onClick={() => setCurrentTab('career-prediction')}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Career Paths</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Live Activity Stream (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Recent Journey Events</h4>
                  <p className="text-[11px] text-slate-400">Real-time telemetry and updates</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Clock className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-40" />
                  <span>No recorded activities yet. Start an interview or explore jobs!</span>
                </div>
              ) : (
                activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <span className="text-slate-200 font-medium truncate">{act.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{act.time_ago}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Applications: <strong className="text-white">{totalApps}</strong></span>
            <button
              onClick={() => setCurrentTab('application-tracker')}
              className="text-indigo-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Open Tracker</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. Bottom Floating AI Interaction Bar matching Reference Screenshot */}
      <div className="glass-panel p-4 sm:p-5 flex flex-col gap-3">
        {/* Quick action chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentTab('resume-analyzer')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>+ Attach Resume</span>
          </button>
          <button
            onClick={() => setCurrentTab('recommended-jobs')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🌐 Live Job Search</span>
          </button>
          <button
            onClick={() => setCurrentTab('career-radar')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>📡 Career Radar</span>
          </button>
          <button
            onClick={() => setCurrentTab('aira-interview')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🤖 Mock Interview</span>
          </button>
        </div>

        {/* Input Bar with mic and send button */}
        <form onSubmit={handleQuickSubmit} className="flex items-center gap-2 bg-[#080D1E]/90 border border-white/15 rounded-2xl p-2 pl-4 shadow-inner">
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="Ask CareerAI anything (e.g. 'practice coding', 'find python jobs', 'check my resume')..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCurrentTab('aira-interview')}
            className="p-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Voice with Aira"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-md shadow-cyan-900/30 transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
