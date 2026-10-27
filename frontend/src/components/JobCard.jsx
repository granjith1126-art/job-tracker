import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

export function CompanyLogo({ logoType, company }) {
  const type = (logoType || company || "").toLowerCase();

  if (type.includes("google")) {
    return (
      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-2.5 shrink-0 shadow-lg backdrop-blur-sm">
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
      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-2.5 shrink-0 shadow-lg backdrop-blur-sm">
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
      <div className="w-12 h-12 rounded-xl bg-[#141C2E] border border-amber-500/20 flex items-center justify-center p-1 text-[#FF9900] font-black text-lg tracking-tighter shrink-0 shadow-lg">
        a<span className="text-xs font-normal text-white">z</span>
      </div>
    );
  }

  const initials = company ? company.substring(0, 2).toUpperCase() : "AI";
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 shadow-lg">
      {initials}
    </div>
  );
}

export function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const parsed = new URL(string.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export default function JobCard({
  job,
  onViewDetails,
  isApplied = false,
  onMarkApplied,
  isApplying = false
}) {
  const isLive = job.is_live;
  const sourceLabel = job.source || "Job Dataset";
  const hasValidDestination = isValidHttpUrl(job.url);

  return (
    <div className="bg-[#0D132A]/70 hover:bg-[#121A38]/80 border border-white/8 hover:border-cyan-400/30 rounded-2xl p-4 md:p-5 transition-all duration-300 backdrop-blur-xl shadow-lg hover:shadow-cyan-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
      
      {/* Left: Logo + Job Info */}
      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
        <CompanyLogo logoType={job.logo_type} company={job.company} />

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 
              onClick={() => onViewDetails(job)}
              className="text-sm font-bold text-white tracking-tight truncate leading-tight group-hover:text-cyan-300 transition-colors cursor-pointer"
              title="Click to view full role overview"
            >
              {job.title}
            </h3>
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{sourceLabel}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10 shrink-0">
                {sourceLabel}
              </span>
            )}
            {job.remote && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                Remote
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 font-medium">
            <span className="font-semibold text-slate-200">{job.company}</span>
            <span className="text-slate-600">•</span>
            <span className="truncate text-slate-300">{job.location}</span>
            {job.salary && job.salary !== "Competitive" && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">{job.salary}</span>
              </>
            )}
            {job.posted_at && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500 text-[11px]">Posted {job.posted_at}</span>
              </>
            )}
          </div>

          {/* Matched & Missing Skills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {job.matched_skills && job.matched_skills.length > 0 ? (
              <>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mr-0.5">Matched:</span>
                {job.matched_skills.slice(0, 3).map((skill, i) => (
                  <span 
                    key={i}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </>
            ) : null}

            {job.missing_skills && job.missing_skills.length > 0 ? (
              <>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mr-0.5">Missing:</span>
                {job.missing_skills.slice(0, 2).map((skill, i) => (
                  <span 
                    key={i}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </>
            ) : (
              job.required_skills?.slice(0, 4).map((skill, i) => (
                <span 
                  key={i}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Match score badge + Apply Now + Mark Applied + View Job */}
      <div className="flex flex-wrap items-center justify-between md:justify-end w-full md:w-auto gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
        <span className={`text-center text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
          (job.match_score || 85) >= 75
            ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40 shadow-xs'
            : 'text-amber-300 bg-amber-500/15 border-amber-400/40'
        }`}>
          {job.match_score || 85}% Match
        </span>

        {/* 1. Functional Apply Now Button (Opens real external destination in new tab) */}
        {hasValidDestination ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="btn-glow px-3 py-1.5 text-xs font-bold text-white rounded-xl inline-flex items-center gap-1.5 shrink-0 transition-all active:scale-95 hover:shadow-cyan-500/25 cursor-pointer"
            title={`Open official job listing on ${sourceLabel}`}
          >
            <span>Apply Now</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white/5 border border-white/5 rounded-xl inline-flex items-center gap-1.5 shrink-0 cursor-not-allowed opacity-60"
            title="External destination URL not available for this legacy record"
          >
            <span>Apply Now</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 2. Explicit Mark as Applied / Applied Tracker Action */}
        {isApplied ? (
          <span 
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 shrink-0 shadow-xs"
            title="Tracked in your Application Tracker"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Applied</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkApplied) onMarkApplied(job);
            }}
            disabled={isApplying}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 inline-flex items-center gap-1 shrink-0 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Confirm you submitted an application to store in Application Tracker"
          >
            <span>{isApplying ? 'Saving...' : 'Mark Applied'}</span>
          </button>
        )}

        {/* 3. View Full Job Details */}
        <button
          type="button"
          onClick={() => onViewDetails(job)}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-xl cursor-pointer shrink-0 transition-colors"
        >
          Details
        </button>
      </div>
    </div>
  );
}
