import React from 'react';
import { X, MapPin, DollarSign, Briefcase, CheckCircle2, Sparkles } from 'lucide-react';
import { CompanyLogo } from './JobCard';

export default function JobDetailsModal({ job, onClose, onApply, isApplying }) {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pr-8">
          <CompanyLogo logoType={job.logo_type} company={job.company} size="w-14 h-14" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600">{job.company}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
            </div>
          </div>
        </div>

        {/* Meta badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Compensation</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{job.salary || 'Competitive'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Job Type / Level</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{job.job_type} ({job.experience_level || 'Mid'})</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 col-span-2 md:col-span-1">
            <span className="text-[11px] text-emerald-700 uppercase font-semibold">AI Match Score</span>
            <p className="text-xs font-extrabold text-emerald-700 mt-0.5">{job.match_score}% Match</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role Overview</h3>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {job.description}
          </p>
        </div>

        {/* Required Skills */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required Skills & Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {job.required_skills?.map((skill, index) => (
              <span
                key={index}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(job)}
            disabled={isApplying}
            className="btn-primary-purple cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isApplying ? 'Submitting...' : '1-Click Quick Apply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}