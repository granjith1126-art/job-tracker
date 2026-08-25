import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import RadialProgress from '../components/RadialProgress';
import { api } from '../services/api';

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

  const topMatch = predictions[0] || { match: 50, title: "Software Engineer" };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Career Predictions</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time career compatibility calculated from your technical skills, experience, and interests.</p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
        
        {/* Left Card: Radial Progress Donut Card */}
        <div className="lg:col-span-5 app-card p-8 bg-white flex flex-col items-center justify-center text-center">
          <RadialProgress percentage={topMatch.match} size={230} strokeWidth={18} title="Top Match" />
          <h3 className="text-sm font-bold text-slate-800 mt-4">{topMatch.title}</h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1">{topMatch.subtitle || 'Optimal career fit based on your verified skills.'}</p>
        </div>

        {/* Right Card: Ranked Career List with Full-Width Progress Bars */}
        <div className="lg:col-span-7 app-card p-7 bg-white flex flex-col justify-center space-y-5">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-12">Computing dynamic career recommendations...</p>
          ) : (
            predictions.map((career, index) => {
              const isSelected = selectedRole?.id === career.id;

              return (
                <div 
                  key={career.id || index} 
                  className={`space-y-2 p-3 rounded-xl transition-all cursor-pointer ${
                    isSelected ? 'bg-indigo-50/70 border border-indigo-200/80 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setSelectedRole(career);
                  }}
                >
                  {/* Text Row: Rank number, Title, and Percentage */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-bold">{index + 1}.</span>
                      <span>{career.title}</span>
                    </div>
                    <span className="font-extrabold text-indigo-600">{career.match}%</span>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${career.match}%` }}
                    />
                  </div>

                  {isSelected && (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 animate-in fade-in">
                      <span>{career.matched_count || 0} skills matched</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRole) onSelectRole(career.id);
                          if (setCurrentTab) setCurrentTab('skill-gap');
                        }}
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        Analyze Skill Gap <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}