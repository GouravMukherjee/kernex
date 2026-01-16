'use client';

import { Container, PageHeader } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function BundlesPage(): JSX.Element {
  return (
    <Container>
      <PageHeader
        title="Bundles"
        description="Manage your AI bundles and models"
      >
        <Button>
          <Plus className="w-4 h-4" />
          Upload Bundle
        </Button>
      </PageHeader>

      <div className="text-center py-12">
        <p className="text-text-secondary">Bundle management coming soon</p>
      </div>
    </Container>
  );
}
