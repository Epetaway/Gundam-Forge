import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cobalt-300">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-semibold uppercase tracking-[0.04em] text-foreground">{title}</h1>
        {description ? <p className="max-w-3xl text-sm text-steel-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
