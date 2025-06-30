import React from 'react';

interface CategoryCircularChartProps {
  name: string;
  score: number;
  maxScore: number;
  color: string;
}

export function CategoryCircularChart({ name, score, maxScore, color }: CategoryCircularChartProps) {
  // Ensure score is within bounds and never 0
  const boundedScore = Math.max(40, Math.min(score, maxScore));
  const percentage = (boundedScore / maxScore) * 100;
  
  // Calculate the circumference and stroke dash array for the progress circle
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Circular Chart */}
      <div className="relative w-28 h-28">
        <svg 
          className="w-full h-full transform -rotate-90" 
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
            className="opacity-20"
          />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          />
        </svg>
        
        {/* Percentage text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      
      {/* Category name */}
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-900">{name}</h4>
        <p className="text-xs text-gray-500">{Math.round(boundedScore)} points</p>
      </div>
    </div>
  );
} 