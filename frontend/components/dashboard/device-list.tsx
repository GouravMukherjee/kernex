'use client';

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeviceCard } from './device-card';
import { Search, SortAsc } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Device } from '@/lib/types';

interface DeviceListProps {
  devices: Device[] | undefined;
  isLoading: boolean;
  onDeviceClick?: (device: Device) => void;
}

type SortField = 'name' | 'status' | 'version' | 'lastHeartbeat';

export function DeviceList({ devices = [], isLoading, onDeviceClick }: DeviceListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredAndSorted = useMemo(() => {
    if (!devices) return [];

    // Filter
    const filtered = devices.filter(
      (d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'status':
          const statusOrder = { online: 0, degraded: 1, offline: 2, error: 3 };
          aVal = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
          bVal = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
          break;
        case 'version':
          aVal = a.currentBundleVersion;
          bVal = b.currentBundleVersion;
          break;
        case 'lastHeartbeat':
          aVal = new Date(a.lastHeartbeat).getTime();
          bVal = new Date(b.lastHeartbeat).getTime();
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [devices, searchQuery, sortField, sortAsc]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSortField('name')}
            className={cn({
              'bg-background-base': sortField === 'name',
            })}
          >
            Name
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSortField('status')}
            className={cn({
              'bg-background-base': sortField === 'status',
            })}
          >
            Status
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSortField('lastHeartbeat')}
            className={cn({
              'bg-background-base': sortField === 'lastHeartbeat',
            })}
          >
            Latest
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setSortAsc(!sortAsc)}
            title={sortAsc ? 'Sort ascending' : 'Sort descending'}
          >
            <SortAsc className={cn('w-4 h-4', { 'rotate-180': !sortAsc })} />
          </Button>
        </div>
      </div>

      {/* Device Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-background-elevated rounded-base animate-pulse" />
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No devices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onClick={() => onDeviceClick?.(device)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
