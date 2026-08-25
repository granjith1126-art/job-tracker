import React from 'react';
import SkillChip from './common/SkillChip';

export function CompanyLogo({ logoType, company }) {
  const type = (logoType || company || "").toLowerCase();

  if (type.includes("google")) {
    return (
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
          <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"/>
        </svg>
      </div>
    );
  }

  if (type.includes("microsoft")) {
    return (
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
        <div className="grid grid-cols-2 gap-1 w-full h-full">
          <div className="bg-[#F25022]" />
          <div className="bg-[#7FBA00]" />
          <div className="bg-[#00A4EF]" />
          <div className="bg-[#FFB900]" />
        </div>
      </div>
    );
  }

  if (type.includes("amazon")) {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#232F3E] flex items-center justify-center p-1 text-[#FF9900] font-black text-lg tracking-tighter shrink-0">
        a<span className="text-xs font-normal text-white">z</span>
      </div>
    );
  }

  const initials = company ? company.substring(0, 2).toUpperCase() : "AI";
  return (
    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0 shadow-2xs">
      {initials}
    </div>
  );
}

export default function JobCard({ job, onViewDetails }) {
  return (
    <div className="app-card app-card-hover p-4 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      
      {/* Left: Logo + Job Info starting at identical x-position */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <CompanyLogo logoType={job.logo_type} company={job.company} />

        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate leading-tight">
            {job.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">{job.company}</span>
            <span>•</span>
            <span className="truncate">{job.location}</span>
          </div>

          {/* Skill Pills aligned */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1 shrink-0">Top Skills:</span>
            {job.required_skills?.slice(0, 4).map((skill, i) => (
              <span 
                key={i}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Match score badge + Fixed width View Job Button */}
      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 shrink-0">
        <span className="w-24 text-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
          {job.match_score}% Match
        </span>

        <button
          onClick={() => onViewDetails(job)}
          className="btn-primary-purple w-24 h-9 cursor-pointer text-xs font-bold shrink-0"
        >
          View Job
        </button>
      </div>
    </div>
  );
}