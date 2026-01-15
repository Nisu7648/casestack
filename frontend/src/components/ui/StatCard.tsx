import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'pink';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false
}) => {
  const colorStyles = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      icon: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      text: 'text-blue-600'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      icon: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      text: 'text-green-600'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      icon: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
      text: 'text-red-600'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      text: 'text-purple-600'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      icon: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
      text: 'text-orange-600'
    },
    pink: {
      bg: 'from-pink-500 to-pink-600',
      icon: 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400',
      text: 'text-pink-600'
    }
  };

  const styles = colorStyles[color];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${styles.icon} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          {trend && (
            <div className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {title}
      </h3>
      <div className={`h-1 w-full bg-gradient-to-r ${styles.bg} rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
    </div>
  );
};

export default StatCard;
