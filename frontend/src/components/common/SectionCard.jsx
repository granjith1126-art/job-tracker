import React from 'react';

export default function SectionCard({ title, subtitle, icon: Icon, action, children, className = "" }) {
  return (
    <div className={`glass-panel p-6 ${className}`}>
      {(title || Icon || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
