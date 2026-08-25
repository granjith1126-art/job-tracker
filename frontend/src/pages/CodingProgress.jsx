import React, { useState, useEffect } from 'react';
import { 
  BarChart3, CheckCircle2, Flame, Award, Target, BookOpen, 
  ArrowRight, Clock, Code2, Sparkles, TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function CodingProgress({ onNavigateTab }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const data = await api.coding.getProgress();
      setProgress(data);
    } catch (err) {
      console.error('Failed to load coding progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Loading coding progress and personalized recommendations...
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No coding records found. Start practicing to track progress.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-full">
      <PageHeader
        title="Coding & Assessment Progress"
        subtitle="Track your algorithm mastery, mock test scores, and personalized learning path."
      />

      {/* Top 4 Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Problems Solved */}
        <SectionCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Problems Solved</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{progress.problems_solved}</span>
              <span className="text-xs text-slate-500 font-medium">/ {progress.total_problems}</span>
            </div>
          </div>
        </SectionCard>

        {/* Accuracy Rate */}
        <SectionCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Accuracy Rate</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{progress.accuracy}%</span>
              <span className="text-xs text-slate-500 font-medium">({progress.total_submissions} subs)</span>
            </div>
          </div>
        </SectionCard>

        {/* Mock Tests Completed */}
        <SectionCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Tests Completed</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{progress.mock_tests_completed}</span>
              <span className="text-xs text-slate-500 font-medium">tests</span>
            </div>
          </div>
        </SectionCard>

        {/* Avg Test Score */}
        <SectionCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Avg Assessment Score</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{progress.average_test_score}%</span>
              <span className="text-xs text-slate-500 font-medium">overall</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Difficulty Breakdown & Personalized Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Breakdown Box */}
        <SectionCard className="p-6 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Difficulty Breakdown
          </h3>

          <div className="space-y-4">
            {/* Easy */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-400">Easy</span>
                <span className="text-slate-300 font-mono">{progress.easy_solved} / {progress.easy_total}</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progress.easy_total ? (progress.easy_solved / progress.easy_total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">Medium</span>
                <span className="text-slate-300 font-mono">{progress.medium_solved} / {progress.medium_total}</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progress.medium_total ? (progress.medium_solved / progress.medium_total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-400">Hard</span>
                <span className="text-slate-300 font-mono">{progress.hard_solved} / {progress.hard_total}</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progress.hard_total ? (progress.hard_solved / progress.hard_total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Personalized Problem Recommendations (2 cols wide) */}
        <SectionCard className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recommended For You
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('coding-practice')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Practice All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {progress.recommended_problems?.length > 0 ? (
              progress.recommended_problems.map((prob) => (
                <div
                  key={prob.id}
                  onClick={() => onNavigateTab && onNavigateTab('coding-practice')}
                  className="p-3.5 bg-slate-950/70 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/40 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {prob.title}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        prob.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                        prob.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{prob.reason}</p>
                  </div>

                  <button className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Great job! You have completed the recommended algorithmic problems.
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent Submissions History Table */}
      <SectionCard className="overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Submissions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Problem</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Runtime</th>
                <th className="py-3 px-5">Language</th>
                <th className="py-3 px-5 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {progress.recent_submissions?.length > 0 ? (
                progress.recent_submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-200">
                      {sub.problem_title}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-400">
                      {sub.runtime_ms > 0 ? `${sub.runtime_ms} ms` : '-'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 uppercase text-[10px] font-mono">
                      {sub.language}
                    </td>
                    <td className="py-3.5 px-5 text-right text-slate-500">
                      {sub.submitted_at}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No coding submissions yet. Run and submit your first problem in Coding Practice!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

