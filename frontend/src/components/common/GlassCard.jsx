import React from 'react';

export default function GlassCard({ children, className = '', hover = true, onClick = null, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel ${hover ? 'glass-panel-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
