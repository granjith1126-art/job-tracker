import React from 'react';
import { X } from 'lucide-react';

export default function SkillChip({ label, onRemove, variant = 'indigo', className = '' }) {
  let style = 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/70';
  if (variant === 'blue') style = 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/70';
  if (variant === 'slate') style = 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/60';

  return (
    <span className={`inline-flex items-center h-7 px-3 rounded-md text-xs font-medium border transition-colors ${style} ${className}`}>
      <span className="truncate max-w-[200px]">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(label)}
          className="ml-1.5 -mr-1 p-0.5 text-current opacity-60 hover:opacity-100 rounded hover:bg-black/5 cursor-pointer transition-opacity"
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}