import React from 'react';
import { Sparkles } from 'lucide-react';

export default function InsightCard({
  icon: Icon,
  title,
  subtitle,
  value,
  description,
  badgeText = "Based on your activity",
  badgeVariant = "indigo", // "indigo", "blue", "emerald", "amber"
  onClick = null,
  className = ""
}) {
  const badgeClass = 
    badgeVariant === 'blue' ? 'badge-sparkle-blue' :
    badgeVariant === 'emerald' ? 'badge-sparkle-emerald' :
    badgeVariant === 'amber' ? 'badge-sparkle-amber' :
    'badge-sparkle';

  return (
    <div
      onClick={onClick}
      className={`glass-card-compact p-5 flex flex-col justify-between h-full min-h-[190px] cursor-pointer group ${className}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all">
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          {value && (
            <span className="text-sm font-black text-cyan-300 tracking-tight font-mono bg-cyan-950/40 px-2.5 py-1 rounded-xl border border-cyan-500/20">
              {value}
            </span>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</p>
          )}
          {description && (
            <p className="text-xs text-slate-300/85 mt-2 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-white/5 flex items-center">
        <span className={badgeClass}>
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="truncate">{badgeText}</span>
        </span>
      </div>
    </div>
  );
}
