import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  striped?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'blue',
  size = 'md',
  showLabel = false,
  animated = true,
  striped = false
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorStyles = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600'
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const stripedPattern = striped
    ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_100%]'
    : '';

  const animationClass = animated ? 'transition-all duration-1000 ease-out' : '';

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colorStyles[color]} ${sizes[size]} rounded-full ${animationClass} ${stripedPattern} relative`}
          style={{ width: `${percentage}%` }}
        >
          {striped && animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
