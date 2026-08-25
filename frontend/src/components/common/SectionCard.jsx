import React from 'react';

export default function SectionCard({ children, className = '', title, icon: Icon, rightElement }) {
  return (
    <div className={`app-card p-6 bg-white ${className}`}>
      {(title || Icon || rightElement) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-indigo-600 shrink-0" />}
            {title && <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>}
          </div>
          {rightElement && (
            <div className="shrink-0">{rightElement}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}