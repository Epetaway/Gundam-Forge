import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  cta?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, cta, className }: EmptyStateProps): JSX.Element {
  return (
    <section className={cn('rounded-lg border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center', className)}>
      {icon ? <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-reading text-sm text-text-muted">{description}</p>
      {cta ? <div className="mt-6 flex justify-center">{cta}</div> : null}
    </section>
  );
}
