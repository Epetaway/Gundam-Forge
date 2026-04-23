import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, hint, className }: StatCardProps): JSX.Element {
  return (
    <article className={cn('rounded-lg border border-cobalt-900/60 bg-[linear-gradient(180deg,hsl(var(--surface-elevated)),hsl(var(--surface-interactive)))] px-4 py-4 shadow-[var(--shadow-card)]', className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </article>
  );
}
