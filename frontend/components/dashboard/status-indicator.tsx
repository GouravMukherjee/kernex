'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { getStatusDotClass, getStatusLabel } from '@/lib/utils/status';
import type { StatusType } from '@/lib/utils/status';

interface StatusIndicatorProps {
  status: StatusType;
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ status, showLabel = false, className }: StatusIndicatorProps): JSX.Element {
  const dotClass = getStatusDotClass(status);
  const label = getStatusLabel(status);
  const isAnimated = status === 'online' || status === 'in_progress' || status === 'pending';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isAnimated ? (
        <motion.div
          className={cn('rounded-full', dotClass)}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      ) : (
        <div className={cn('rounded-full', dotClass)} />
      )}
      {showLabel && <span className="text-xs font-medium text-text-secondary">{label}</span>}
    </div>
  );
}
