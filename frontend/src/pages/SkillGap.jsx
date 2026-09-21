import React, { useState, useEffect } from 'react';
import { Target, Zap, CheckCircle2, AlertTriangle, XCircle, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import GlassCard from '../components/common/GlassCard';

export default function SkillGap({ userProfile, selectedRole = 'ml-engineer' }) {
  const [role, setRole] = useState(selectedRole);
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [readinessScore, setReadinessScore] = useState(70);
  const [recommendations, setRecommendations] = useState([]);
  const [gapData, setGapData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load roles catalog
  useEffect(() => {
    async function loadRoles() {
      try {
        const roles = await api.catalog.getRoles();
        setRolesCatalog(roles);
      } catch (err) {
        console.error('Failed to load roles catalog:', err);
      }
    }
    loadRoles();
  }, []);

  useEffect(() => {
    const fetchSkillGap = async () => {
      setLoading(true);
      try {
        const data = await api.career.getSkillGap(role);
        if (data.matrix || data.skills_matrix) {
          setGapData(data.matrix || data.skills_matrix || []);
        }
        if (data.readiness_score !== undefined) {
          setReadinessScore(data.readiness_score);
        }
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error('Failed to fetch skill gap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkillGap();
  }, [role, userProfile]);

  const getGapBadge = (item) => {
    if (item.gap === '✓ Matched' || item.gap === 'No Gap' || item.gap === 'None' || item.severity === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>✓ Matched</span>
        </span>
      );
    }
    if (item.gap === 'Medium' || item.gap === 'Medium Gap' || item.severity === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Medium Gap</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
        <XCircle className="w-3.5 h-3.5" />
        <span>High Gap</span>
      </span>
    );
  };

  return (
    <div className="p-6 sm:p-10 space-y-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header with Role Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">Skill Gap Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Detailed comparison between your verified skills and industry requirements.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-bold text-cyan-200">
            <span>Readiness:</span>
            <span className="text-cyan-400 font-extrabold font-mono text-sm">{readinessScore}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Target Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-[#0F172E] border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
            >
              {rolesCatalog.length > 0 ? (
                rolesCatalog.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#090D1E] text-white">{r.title}</option>
                ))
              ) : (
                <option value="ml-engineer">Machine Learning Engineer</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main Glass Matrix Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Core Competency Matrix</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{gapData.length} Skills Evaluated</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider h-11">
                <th className="py-3 px-6">Skill / Technology</th>
                <th className="py-3 px-6">Your Level</th>
                <th className="py-3 px-6">Industry Requirement</th>
                <th className="py-3 px-6">Gap Status</th>
                <th className="py-3 px-6">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Evaluating role requirements against profile...
                  </td>
                </tr>
              ) : gapData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matrix data available. Select a role above.
                  </td>
                </tr>
              ) : (
                gapData.map((item, index) => (
                  <tr key={index} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{item.skill}</span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-300">
                      {item.your_level || 'None'}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-300">
                      {item.required_level || 'Intermediate'}
                    </td>
                    <td className="py-3.5 px-6">
                      {getGapBadge(item)}
                    </td>
                    <td className="py-3.5 px-6 text-slate-300/80">
                      {item.action || `Learn ${item.skill} fundamentals & practice coding`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Learning Recommendations Cards */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Targeted Learning Path</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="glass-card-compact p-5 space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Priority {i + 1}</span>
                <h5 className="text-sm font-bold text-white">{rec.title || rec.skill || `Skill ${i + 1}`}</h5>
                <p className="text-xs text-slate-300/80 leading-relaxed">{rec.description || rec.action || "Recommended module to close role gap."}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
