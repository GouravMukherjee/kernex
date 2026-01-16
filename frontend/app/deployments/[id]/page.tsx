'use client';

import { Container, PageHeader } from '@/components/layout/container';
import { useDeployment } from '@/lib/api/deployments';

interface Props {
  params: {
    id: string;
  };
}

export default function DeploymentDetailPage({ params }: Props): JSX.Element {
  const { data: deployment, isLoading } = useDeployment(params.id);

  if (isLoading) {
    return (
      <Container>
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-background-elevated rounded mb-4" />
        </div>
      </Container>
    );
  }

  if (!deployment) {
    return (
      <Container>
        <PageHeader title="Deployment Not Found" />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader title={`Deployment ${deployment.id}`} description={`Bundle v${deployment.bundleVersion}`} />
      <div className="text-center py-12">
        <p className="text-text-secondary">Deployment detail page coming soon</p>
      </div>
    </Container>
  );
}
