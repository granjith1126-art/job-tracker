import React from 'react';

export default function PageHeader({ title, subtitle, actions = null, badge = null, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
