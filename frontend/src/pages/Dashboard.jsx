import React from 'react';
import { FileText, Briefcase, Zap, Send, Sparkles, Code2, CheckCircle2, User, Target, Clock } from 'lucide-react';
import SparklineChart from '../components/SparklineChart';

export default function Dashboard({ stats, setCurrentTab, onSelectCareer }) {
  const profileStrength = stats?.profile_strength || 20;
  const predictedCareer = stats?.predicted_career || "Software Engineer";
  const predictedMatch = stats?.predicted_match || 50;
  const skillMatch = stats?.skill_match_overall || 50;
  const totalApps = stats?.total_applications || 0;
  const inProgressApps = stats?.in_progress_applications || 0;
  const topCareer = stats?.top_career || {
    title: "Software Engineer",
    match: 65,
    subtitle: "Build scalable web applications and cloud backend services.",
    top_skills: ["Python", "Algorithms", "Databases", "APIs"],
    trend_data: [40, 48, 55, 60, 65]
  };
  const secondaryCareers = stats?.secondary_careers || [];
  const activities = stats?.recent_activities || [];

  const getActivityIcon = (type) => {
    switch(type) {
      case 'file': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'briefcase': return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'zap': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'send': return <Send className="w-4 h-4 text-rose-500" />;
      case 'code': return <Code2 className="w-4 h-4 text-indigo-600" />;
      case 'check': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'user': return <User className="w-4 h-4 text-purple-600" />;
      case 'target': return <Target className="w-4 h-4 text-indigo-600" />;
      default: return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getActivityBg = (type) => {
    switch(type) {
      case 'file': return 'bg-blue-50 border-blue-100';
      case 'briefcase': return 'bg-emerald-50 border-emerald-100';
      case 'zap': return 'bg-amber-50 border-amber-100';
      case 'send': return 'bg-rose-50 border-rose-100';
      case 'code': return 'bg-indigo-50 border-indigo-100';
      case 'check': return 'bg-emerald-50 border-emerald-100';
      case 'user': return 'bg-purple-50 border-purple-100';
      case 'target': return 'bg-indigo-50 border-indigo-100';
      default: return 'bg-indigo-50 border-indigo-100';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none">
      
      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        
        {/* Card 1: Profile Strength */}
        <div 
          onClick={() => setCurrentTab('profile')}
          className="app-card app-card-hover p-6 cursor-pointer bg-white flex flex-col justify-between space-y-3"
        >
          <span className="text-xs font-semibold text-slate-500">Profile Strength</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">{profileStrength}%</div>
          <div className="space-y-2 pt-1">
            <span className={`text-xs font-bold block ${profileStrength >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {profileStrength >= 70 ? 'Strong Profile' : 'Complete your profile'}
            </span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                style={{ width: `${profileStrength}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Predicted Career */}
        <div 
          onClick={() => setCurrentTab('career-prediction')}
          className="app-card app-card-hover p-6 cursor-pointer bg-white flex flex-col justify-between space-y-3"
        >
          <span className="text-xs font-semibold text-slate-500">Predicted Career</span>
          <div className="text-2xl font-black text-slate-900 tracking-tight truncate leading-tight">{predictedCareer}</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 pt-1">
            <span>{predictedMatch}% Match</span>
            <span className="text-emerald-500 text-xs">🟢</span>
          </div>
        </div>

        {/* Card 3: Skill Match */}
        <div 
          onClick={() => setCurrentTab('skill-gap')}
          className="app-card app-card-hover p-6 cursor-pointer bg-white flex flex-col justify-between space-y-3"
        >
          <span className="text-xs font-semibold text-slate-500">Target Role Readiness</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">{skillMatch}%</div>
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-blue-600 block">Core Benchmark</span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                style={{ width: `${skillMatch}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Applications */}
        <div 
          onClick={() => setCurrentTab('application-tracker')}
          className="app-card app-card-hover p-6 cursor-pointer bg-white flex flex-col justify-between space-y-3"
        >
          <span className="text-xs font-semibold text-slate-500">Tracked Applications</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">{totalApps}</div>
          <div className="pt-1">
            <span className="text-xs font-semibold text-slate-500 block">{inProgressApps} Active / In Review</span>
          </div>
        </div>

      </div>

      {/* 2-Column Split: Career Recommendation (70%) + Recent Activity (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left Card: Career Recommendation */}
        <div className="lg:col-span-8 app-card p-6 space-y-5 bg-white">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Career Compatibility & Predictions</h2>

          {/* Primary Top Recommendation Card */}
          <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  1. {topCareer.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {topCareer.subtitle}
                </p>
              </div>
              <span className="match-badge shrink-0">
                {topCareer.match}% Match
              </span>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              <span className="text-slate-400 font-normal">Core Skill Set: </span>
              {topCareer.top_skills?.join(', ') || 'Python, SQL, Algorithms'}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
              <button
                onClick={() => setCurrentTab('career-prediction')}
                className="btn-primary-purple self-start"
              >
                View Predictions
              </button>

              <div className="self-end sm:self-auto shrink-0">
                <SparklineChart data={topCareer.trend_data || [50, 60, 70, 80, 90]} width={220} height={55} />
              </div>
            </div>
          </div>

          {/* Secondary Recommendations List */}
          {secondaryCareers.length > 0 && (
            <div className="space-y-3 pt-1">
              {secondaryCareers.map((c, idx) => (
                <div 
                  key={idx}
                  onClick={() => setCurrentTab('career-prediction')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800">{idx + 2}. {c.title}</span>
                  <span className="match-badge">
                    {c.match}% Match
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Dynamic Recent Activity */}
        <div className="lg:col-span-4 app-card p-6 space-y-5 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h2>
            <span className="text-[10px] text-slate-400 font-medium">Real-time log</span>
          </div>

          <div className="space-y-3.5">
            {activities.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-slate-400 space-y-2">
                <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No activity recorded yet.</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Add skills in Profile, upload a resume, or practice coding problems to start building your activity history!
                </p>
              </div>
            ) : (
              activities.map((act, index) => (
                <div key={index} className="flex items-center gap-3.5 group">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${getActivityBg(act.icon_type)}`}>
                    {getActivityIcon(act.icon_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                      {act.time_ago}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}