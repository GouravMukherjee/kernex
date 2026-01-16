'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from './status-indicator';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/format';
import { getMemoryColorClass, getCpuColorClass } from '@/lib/utils/status';
import type { Device } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

interface DeviceCardProps {
  device: Device;
  onClick?: () => void;
}

export function DeviceCard({ device, onClick }: DeviceCardProps): JSX.Element {
  const memoryColor = getMemoryColorClass(device.memory.percentage);
  const cpuColor = getCpuColorClass(device.cpu.percentage);

  return (
    <Card
      onClick={onClick}
      className={cn('card-hover overflow-hidden', {
        'cursor-pointer': !!onClick,
      })}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <StatusIndicator status={device.status} />
            <div className="flex-1">
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <CardDescription className="text-xs font-mono mt-1">{device.deviceId}</CardDescription>
            </div>
          </div>
          {onClick && <ChevronRight className="w-5 h-5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Type and Version */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wider">Type</p>
            <p className="text-sm font-medium text-text-secondary mt-1">{device.type.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wider">Bundle</p>
            <p className="text-sm font-mono text-text-secondary mt-1">{device.currentBundleVersion}</p>
          </div>
        </div>

        {/* Last Heartbeat */}
        <div>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Last Heartbeat</p>
          <p className="text-sm text-text-secondary mt-1">{formatRelativeTime(device.lastHeartbeat)}</p>
        </div>

        {/* Resource Usage */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Memory</p>
              <p className="text-xs font-mono text-text-secondary">{device.memory.percentage}%</p>
            </div>
            <div className="w-full h-2 bg-background-base rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all duration-300 rounded-full', memoryColor)}
                style={{ width: `${device.memory.percentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-tertiary uppercase tracking-wider">CPU</p>
              <p className="text-xs font-mono text-text-secondary">{device.cpu.percentage}%</p>
            </div>
            <div className="w-full h-2 bg-background-base rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all duration-300 rounded-full', cpuColor)}
                style={{ width: `${device.cpu.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metadata Tags */}
        {device.metadata.tags && device.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {device.metadata.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {device.metadata.tags.length > 3 && <Badge variant="secondary" className="text-xs">+{device.metadata.tags.length - 3}</Badge>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
