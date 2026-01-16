'use client';

import { Container, PageHeader } from '@/components/layout/container';

export default function DeploymentsPage(): JSX.Element {
  return (
    <Container>
      <PageHeader
        title="Deployments"
        description="View deployment history and status"
      />

      <div className="text-center py-12">
        <p className="text-text-secondary">Deployments history coming soon</p>
      </div>
    </Container>
  );
}
