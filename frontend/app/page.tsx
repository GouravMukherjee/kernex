'use client';

import React, { useState } from 'react';
import { Container, PageHeader } from '@/components/layout/container';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { DeviceList } from '@/components/dashboard/device-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardStats, useDevices } from '@/lib/api/devices';
import { useDeployments } from '@/lib/api/deployments';
import { useBundles } from '@/lib/api/bundles';
import { Plus } from 'lucide-react';
import type { Device } from '@/lib/types';

export default function DashboardPage(): JSX.Element {
  const [selectedTab, setSelectedTab] = useState('devices');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const { data: deployments } = useDeployments();
  const { data: bundles } = useBundles();

  return (
    <Container>
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Manage your edge AI devices and deployments"
      >
        <Button>
          <Plus className="w-4 h-4" />
          Deploy Bundle
        </Button>
      </PageHeader>

      {/* Stats Overview */}
      <StatsOverview stats={stats} isLoading={statsLoading} />

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="devices">Devices ({devices?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="bundles">Bundles ({bundles?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="deployments">Deployments ({deployments?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="mt-6">
          <DeviceList
            devices={devices}
            isLoading={devicesLoading}
            onDeviceClick={setSelectedDevice}
          />
        </TabsContent>

        <TabsContent value="bundles" className="mt-6">
          <div className="text-center py-12">
            <p className="text-text-secondary">Bundles management coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="mt-6">
          <div className="text-center py-12">
            <p className="text-text-secondary">Deployments history coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Device Details (Future Modal) */}
      {selectedDevice && (
        <div className="mt-8 p-6 bg-background-elevated rounded-base border border-border-default">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Selected: {selectedDevice.name}</h2>
          <p className="text-text-secondary text-sm">{selectedDevice.deviceId}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setSelectedDevice(null)}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </Container>
  );
}
