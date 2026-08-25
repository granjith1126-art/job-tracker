import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const norm = (status || 'Applied').toLowerCase();

  let style = 'bg-blue-50 text-blue-700 border-blue-200';
  let dotColor = 'bg-blue-600';

  if (norm === 'interview') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (norm === 'offer') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-600';
  } else if (norm === 'rejected') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-600';
  } else if (norm === 'shortlisted') {
    style = 'bg-purple-50 text-purple-700 border-purple-200';
    dotColor = 'bg-purple-600';
  }

  return (
    <span className={`inline-flex items-center justify-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold border ${style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
}