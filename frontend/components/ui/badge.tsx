import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-smooth', {
  variants: {
    variant: {
      default: 'border border-transparent bg-accent-primary text-white',
      secondary: 'border border-transparent bg-background-elevated text-text-secondary hover:bg-background-elevated/80',
      success: 'border border-transparent bg-status-online text-white',
      error: 'border border-transparent bg-status-error text-white',
      warning: 'border border-transparent bg-status-degraded text-white',
      offline: 'border border-transparent bg-status-offline text-white',
      outline: 'border border-border-default text-text-secondary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
