import React from 'react';

export default function PageHeader({ title, subtitle, rightAction }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">{subtitle}</p>}
      </div>
      {rightAction && (
        <div className="flex items-center gap-3 shrink-0">
          {rightAction}
        </div>
      )}
    </div>
  );
}