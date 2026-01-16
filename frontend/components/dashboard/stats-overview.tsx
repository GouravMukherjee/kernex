'use client';

import React from 'react';
import { StatCard } from './stat-card';
import { Cpu, HardDrive, Package, Zap } from 'lucide-react';
import type { DashboardStats } from '@/lib/types';

interface StatsOverviewProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={<HardDrive className="w-5 h-5" />}
        label="Total Devices"
        value={stats?.totalDevices ?? 0}
        subtext={`${stats?.onlineDevices ?? 0} online`}
        isLoading={isLoading}
      />
      <StatCard
        icon={<Package className="w-5 h-5" />}
        label="Active Bundles"
        value={stats?.activeBundles ?? 0}
        subtext={`v${stats?.latestBundleVersion ?? '—'}`}
        isLoading={isLoading}
      />
      <StatCard
        icon={<Zap className="w-5 h-5" />}
        label="Total Deployments"
        value={stats?.totalDeployments ?? 0}
        subtext={`${Math.round((stats?.successRate ?? 0) * 100)}% success rate`}
        trend="up"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Cpu className="w-5 h-5" />}
        label="Avg Rollback Time"
        value={`${stats?.avgRollbackTime ?? 0}m`}
        subtext="under budget"
        trend="down"
        isLoading={isLoading}
      />
    </div>
  );
}
