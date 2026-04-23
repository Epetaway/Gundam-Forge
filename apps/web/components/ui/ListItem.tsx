import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface ListItemProps {
  title: string;
  meta: string;
  action?: React.ReactNode;
  className?: string;
}

export function ListItem({ title, meta, action, className }: ListItemProps): JSX.Element {
  return (
    <article className={cn('flex items-center justify-between gap-4 rounded-lg border border-cobalt-900/60 bg-[linear-gradient(180deg,hsl(var(--surface-elevated)),hsl(var(--surface-interactive)))] px-4 py-4 shadow-[var(--shadow-card)]', className)}>
      <div className="min-w-0">
        <h4 className="truncate text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 truncate text-xs text-text-muted">{meta}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </article>
  );
}
