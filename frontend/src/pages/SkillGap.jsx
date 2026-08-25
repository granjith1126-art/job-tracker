import React, { useState, useEffect } from 'react';
import { Target, Zap, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

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
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>✓ Matched</span>
        </span>
      );
    }
    if (item.gap === 'Medium' || item.gap === 'Medium Gap' || item.severity === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Medium Gap</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
        <XCircle className="w-3.5 h-3.5" />
        <span>High Gap</span>
      </span>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-none">
      {/* View Header with Target Role Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Skill Gap Analysis</h1>
          <p className="text-xs text-slate-500 mt-1">Detailed comparison between your verified skills and industry requirements for target roles.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-900">
            <span>Readiness:</span>
            <span className="text-indigo-600 font-extrabold">{readinessScore}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Target Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-indigo-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              {rolesCatalog.length > 0 ? (
                rolesCatalog.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))
              ) : (
                <option value="ml-engineer">Machine Learning Engineer</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main Full-Width Table Card */}
      <div className="app-card bg-white overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold text-slate-500 h-12">
                <th className="py-3 px-6 font-bold text-slate-600">Core Skill</th>
                <th className="py-3 px-6 font-bold text-slate-600">Your Current Level</th>
                <th className="py-3 px-6 font-bold text-slate-600">Required Benchmark</th>
                <th className="py-3 px-6 font-bold text-slate-600 text-left">Gap Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500">
                    Evaluating skill gap matrix...
                  </td>
                </tr>
              ) : gapData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500">
                    No skill gap requirements found for this role.
                  </td>
                </tr>
              ) : (
                gapData.map((row, index) => (
                  <tr key={index} className="h-14 hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {row.skill}
                    </td>
                    <td className="py-4 px-6">
                      <span className={row.your_level === 'None' ? 'text-slate-400 italic' : 'text-slate-800 font-semibold'}>
                        {row.your_level}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{row.required_level}</td>
                    <td className="py-4 px-6">{getGapBadge(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations Banner */}
      {recommendations.length > 0 && (
        <div className="app-card p-5 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white border border-indigo-100/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Learning Roadmap Recommendations</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {recommendations.map((rec, idx) => (
              <span key={idx} className="px-3 py-1 bg-white rounded-lg border border-indigo-200/60 text-xs font-semibold text-indigo-700 shadow-2xs">
                Learn: <strong>{rec}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}