import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-border bg-steel-200/70 text-steel-700',
        accent: 'border-cobalt-400/40 bg-cobalt-500/15 text-cobalt-300',
        success: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-300',
        warning: 'border-amber-300/40 bg-amber-400/15 text-amber-300',
        destructive: 'border-red-300/40 bg-red-400/15 text-red-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
