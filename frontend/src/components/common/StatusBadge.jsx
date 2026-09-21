import React from 'react';

export default function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let badgeClass = 'bg-blue-500/10 text-blue-300 border-blue-500/25';
  
  if (s.includes('interview')) {
    badgeClass = 'bg-amber-500/10 text-amber-300 border-amber-500/25';
  } else if (s.includes('offer') || s.includes('accepted')) {
    badgeClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  } else if (s.includes('reject')) {
    badgeClass = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
      {status}
    </span>
  );
}
