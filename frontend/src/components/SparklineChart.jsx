import React from 'react';

export default function SparklineChart({ data = [55, 62, 70, 78, 85, 92], width = 220, height = 65 }) {
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 16) + 8;
    const y = height - 10 - ((val - min) / range) * (height - 20);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 8,${height - 4} L ${points.join(' L ')} L ${width - 8},${height - 4} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      {/* Shaded Area */}
      <path d={areaD} fill="url(#purpleGradient)" />

      {/* Smooth Line */}
      <path
        d={pathD}
        fill="none"
        stroke="#4F46E5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End Dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="3.5"
          fill="#4F46E5"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}