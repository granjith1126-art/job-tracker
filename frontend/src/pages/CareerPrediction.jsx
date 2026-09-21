import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Target, ChevronRight } from 'lucide-react';
import RadialProgress from '../components/RadialProgress';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import GlassCard from '../components/common/GlassCard';

export default function CareerPrediction({ userProfile, onSelectRole, setCurrentTab }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const data = await api.career.getPredictions();
        if (data.predictions && data.predictions.length > 0) {
          setPredictions(data.predictions);
          setSelectedRole(data.predictions[0]);
        }
      } catch (err) {
        console.error('Failed to fetch predictions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, [userProfile]);

  const topMatch = predictions[0] || { match: 65, title: "Software Engineer", subtitle: "Build scalable web applications and cloud backend services." };

  return (
    <div className="p-6 sm:p-10 space-y-8 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
      
      <PageHeader
        title="Career Predictions"
        subtitle="Multi-vector predictive intelligence calculated from your verified technical skills, experience, and Career Radar interests."
        badge="AI Career Trajectory"
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
        
        {/* Left: Top Match Hero Card */}
        <div className="lg:col-span-5 glass-panel p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <RadialProgress 
              percentage={topMatch.match} 
              size={210} 
              strokeWidth={16} 
              primaryColor="#38BDF8" 
              secondaryColor="rgba(255,255,255,0.06)" 
              title="Top Fit" 
            />
            
            <h3 className="text-xl font-extrabold text-white mt-6 font-display">{topMatch.title}</h3>
            <p className="text-xs text-slate-300/85 max-w-xs mt-2 leading-relaxed">
              {topMatch.subtitle || 'Optimal career fit based on your verified skills and project track record.'}
            </p>

            <button
              onClick={() => {
                if (onSelectRole) onSelectRole(topMatch.id);
                if (setCurrentTab) setCurrentTab('skill-gap');
              }}
              className="btn-glow text-xs mt-6 cursor-pointer"
            >
              <span>Analyze Skill Gap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Ranked Career Paths with Progress Bars */}
        <div className="lg:col-span-7 glass-panel p-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Ranked Compatibility Paths</h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">{predictions.length} Paths Calculated</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] custom-scrollbar pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-12">Computing dynamic career recommendations...</p>
            ) : (
              predictions.map((career, index) => {
                const isSelected = selectedRole?.id === career.id;

                return (
                  <div 
                    key={career.id || index} 
                    className={`space-y-2 p-3.5 rounded-2xl transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-600/15 border-cyan-400/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                        : 'bg-white/5 hover:bg-white/10 border-white/5'
                    }`}
                    onClick={() => {
                      setSelectedRole(career);
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                          {index + 1}
                        </span>
                        <span className="text-white text-sm font-semibold">{career.title}</span>
                      </div>
                      <span className="font-extrabold text-cyan-400 font-mono text-sm">{career.match}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${career.match}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Click any career to inspect details.</span>
            {selectedRole && (
              <button
                onClick={() => {
                  if (onSelectRole) onSelectRole(selectedRole.id);
                  if (setCurrentTab) setCurrentTab('skill-gap');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View {selectedRole.title} Gap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
