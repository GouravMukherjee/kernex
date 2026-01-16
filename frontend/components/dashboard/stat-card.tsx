import React from 'react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}

export function StatCard({ icon, label, value, subtext, trend, isLoading }: StatCardProps): JSX.Element {
  return (
    <div className="card-base hover:bg-background-elevated/80 transition-smooth">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-text-secondary text-sm font-medium">{label}</p>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-8 w-24 bg-background-hover rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold text-text-primary">{value}</p>
            )}
          </div>
          {subtext && <p className="text-text-tertiary text-xs mt-1">{subtext}</p>}
        </div>
        <div
          className={cn('p-3 rounded-lg', {
            'bg-background-hover text-accent-primary': !trend || trend === 'neutral',
            'bg-emerald-500/10 text-status-online': trend === 'up',
            'bg-red-500/10 text-status-error': trend === 'down',
          })}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
