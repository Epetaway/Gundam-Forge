import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  label: string;
  value: number;
  colorClassName?: string;
  className?: string;
}

export function ProgressBar({ label, value, colorClassName, className }: ProgressBarProps): JSX.Element {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-text-muted">{normalized.toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          aria-hidden="true"
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            colorClassName ?? 'bg-accent',
          )}
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
