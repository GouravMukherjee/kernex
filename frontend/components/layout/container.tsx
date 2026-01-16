import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Container({ className, children, ...props }: ContainerProps): JSX.Element {
  return (
    <div className={cn('max-w-7xl mx-auto px-6 py-8', className)} {...props}>
      {children}
    </div>
  );
}

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children, className, ...props }: HeaderProps): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between', className)} {...props}>
      <div className="flex-1">
        <h1 className="text-4xl font-semibold text-text-primary tracking-tight">{title}</h1>
        {description && <p className="text-text-secondary mt-1">{description}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
