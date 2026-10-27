import React from 'react';
import { X, MapPin, DollarSign, Briefcase, CheckCircle2, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { CompanyLogo, isValidHttpUrl } from './JobCard';

export default function JobDetailsModal({
  job,
  onClose,
  onMarkApplied,
  isApplied = false,
  isApplying = false
}) {
  if (!job) return null;

  const hasValidUrl = isValidHttpUrl(job.url);
  const sourceLabel = job.source || 'Company Site';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#090E22]/95 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pr-8">
          <CompanyLogo logoType={job.logo_type} company={job.company} />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-cyan-400">{job.company}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {job.location}
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Globe className="w-3 h-3 text-slate-500" />
                Source: <span className="text-slate-300 font-medium">{sourceLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Meta badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#0D132A]/80 border border-white/8">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Compensation</span>
            <p className="text-xs font-bold text-white mt-0.5">{job.salary || 'Competitive'}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0D132A]/80 border border-white/8">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Job Type / Level</span>
            <p className="text-xs font-bold text-white mt-0.5">{job.job_type} ({job.experience_level || 'Mid'})</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 col-span-2 md:col-span-1">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold">AI Match Score</span>
            <p className="text-xs font-extrabold text-emerald-300 mt-0.5">{job.match_score || 85}% Match</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Role Overview</h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#0D132A]/60 p-4 rounded-xl border border-white/8 whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {/* Required Skills */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Required Skills & Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {job.required_skills?.map((skill, index) => (
              <span
                key={index}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-400/25 flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Actions Section: Apply Now + Mark as Applied */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            {hasValidUrl ? (
              <span>Opens destination in a new tab without leaving CareerAI.</span>
            ) : (
              <span className="text-amber-400/90">External application URL not available for this role.</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
            >
              Close
            </button>

            {/* 1. Apply on Provider / External URL */}
            {hasValidUrl ? (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
                title={`Open official job page on ${sourceLabel}`}
              >
                <span>Apply on {sourceLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 bg-white/5 border border-white/5 flex items-center gap-1.5 cursor-not-allowed opacity-60"
              >
                <span>Apply Unavailable</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* 2. Mark as Applied action */}
            {isApplied ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tracked</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onMarkApplied && onMarkApplied(job)}
                disabled={isApplying}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                title="Confirm application submitted to track in Application Tracker"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isApplying ? 'Saving...' : 'Mark as Applied'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
