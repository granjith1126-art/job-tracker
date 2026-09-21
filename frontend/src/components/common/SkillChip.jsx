import React from 'react';

export default function SkillChip({ skill, onRemove = null, variant = "default" }) {
  const isCyan = variant === "cyan" || variant === "default";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
      isCyan 
        ? 'bg-cyan-950/30 text-cyan-300 border border-cyan-500/25 shadow-sm'
        : 'bg-white/5 text-slate-200 border border-white/10'
    }`}>
      <span>{skill}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(skill)}
          className="text-cyan-400 hover:text-white transition-colors ml-0.5 cursor-pointer"
        >
          ×
        </button>
      )}
    </span>
  );
}
