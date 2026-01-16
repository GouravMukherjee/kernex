'use client';

import { Container, PageHeader } from '@/components/layout/container';

export default function DevicesPage(): JSX.Element {
  return (
    <Container>
      <PageHeader
        title="Devices"
        description="View and manage your edge devices"
      />

      <div className="text-center py-12">
        <p className="text-text-secondary">Device details page coming soon</p>
      </div>
    </Container>
  );
}
