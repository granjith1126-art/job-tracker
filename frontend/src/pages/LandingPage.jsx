import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  FileText, 
  Zap, 
  Briefcase, 
  ClipboardList,
  CheckCircle
} from 'lucide-react';
import { LandingNavbar } from '../components/Navbar';

export default function LandingPage({ onGetStarted, setCurrentTab }) {
  const featureCards = [
    {
      id: 'career-prediction',
      title: 'AI Career Prediction',
      desc: 'Get the best career suggestions',
      icon: Target
    },
    {
      id: 'resume-analyzer',
      title: 'Resume Analyzer',
      desc: 'Extract skills and analyze your resume',
      icon: FileText
    },
    {
      id: 'skill-gap',
      title: 'Skill Gap Analysis',
      desc: 'Find gaps and improve your skills',
      icon: Zap
    },
    {
      id: 'recommended-jobs',
      title: 'Job Recommendations',
      desc: 'Get matched jobs perfect for you',
      icon: Briefcase
    },
    {
      id: 'application-tracker',
      title: 'Application Tracker',
      desc: 'Track and manage your applications',
      icon: ClipboardList
    }
  ];

  return (
    <div className="min-h-screen bg-[#070A11] bg-radial-hero flex flex-col justify-between text-white selection:bg-indigo-600 selection:text-white">
      {/* Navbar */}
      <LandingNavbar onGetStarted={onGetStarted} />

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-8 py-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wide shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI-Powered Career Guidance</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] font-display">
              Discover Your Best <br />
              <span className="text-gradient">Career Path with AI</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
              Upload your resume, analyze your skills, and get AI-powered career recommendations, 
              skill gap analysis, and the best job matches for your future.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onGetStarted}
                className="h-12 px-7 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-xl shadow-purple-900/40 hover:shadow-purple-700/60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTab('recommended-jobs')}
                className="h-12 px-7 rounded-2xl bg-[#121829] hover:bg-[#1A2238] border border-[#25324E] hover:border-purple-500/40 text-slate-200 font-semibold text-xs transition-all cursor-pointer inline-flex items-center justify-center"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right Column: 3D Character & Floating UI Cards */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              
              {/* Background ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/25 to-indigo-500/20 rounded-full filter blur-3xl" />

              {/* Central 3D Avatar Illustration Box */}
              <div className="relative z-10 w-80 h-80 rounded-3xl bg-gradient-to-b from-[#1E1738] to-[#121124] border border-purple-500/30 p-4 shadow-2xl flex flex-col items-center justify-center overflow-hidden group">
                
                {/* Modern Avatar Illustration */}
                <div className="relative flex flex-col items-center">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 p-1 shadow-xl flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" 
                      alt="Tech Professional Avatar" 
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://ui-avatars.com/api/?name=Arjun+Sharma&background=6D28D9&color=fff&size=256";
                      }}
                    />
                  </div>

                  <div className="mt-4 px-4 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 backdrop-blur-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-white tracking-wide">Machine Learning Engineer</span>
                  </div>
                </div>

                {/* Floating UI Chips */}
                <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-[#0F1424]/90 border border-[#2B3852] shadow-lg flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Match Score</div>
                    <div className="text-xs font-black text-emerald-400">92%</div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-[#0F1424]/90 border border-[#2B3852] shadow-lg flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Resume</div>
                    <div className="text-xs font-black text-purple-300">12 Skills Extracted</div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Bottom 5 Feature Cards Row */}
        <div className="mt-14 pt-8 border-t border-[#182033] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setCurrentTab(card.id)}
                className="p-5 rounded-2xl bg-[#0E1322]/80 hover:bg-[#141C30] border border-[#1C253B] hover:border-purple-500/40 cursor-pointer transition-all duration-300 group hover:-translate-y-1 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                    {card.title}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-normal leading-snug">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#151D2F] py-5 px-8 text-center text-xs text-slate-500">
        © 2026 CareerAI — AI-Powered Career Guidance & Job Application Tracking System
      </footer>
    </div>
  );
}