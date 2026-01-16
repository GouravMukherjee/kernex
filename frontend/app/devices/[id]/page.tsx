'use client';

import { Container, PageHeader } from '@/components/layout/container';
import { useDevice } from '@/lib/api/devices';

interface Props {
  params: {
    id: string;
  };
}

export default function DeviceDetailPage({ params }: Props): JSX.Element {
  const { data: device, isLoading } = useDevice(params.id);

  if (isLoading) {
    return (
      <Container>
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-background-elevated rounded mb-4" />
        </div>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container>
        <PageHeader title="Device Not Found" />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader title={device.name} description={device.deviceId} />
      <div className="text-center py-12">
        <p className="text-text-secondary">Device detail page coming soon</p>
      </div>
    </Container>
  );
}
