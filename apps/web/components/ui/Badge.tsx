import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        default: 'border-cobalt-900/60 bg-steel-200/70 text-steel-700',
        accent: 'border-cobalt-400/40 bg-cobalt-500/15 text-cobalt-300',
        success: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-300',
        warning: 'border-amber-300/40 bg-amber-400/15 text-amber-300',
        destructive: 'border-red-300/40 bg-red-400/15 text-red-300',
        blue: 'border-blue-500/60 bg-blue-500/20 text-blue-200',
        red: 'border-red-500/60 bg-red-500/20 text-red-200',
        green: 'border-green-500/60 bg-green-500/20 text-green-200',
        white: 'border-slate-300/60 bg-slate-200/20 text-slate-100',
        purple: 'border-purple-500/60 bg-purple-500/20 text-purple-200',
        archetype: 'border-slate-500/50 bg-slate-500/15 text-slate-200',
        status: 'border-cobalt-500/50 bg-cobalt-500/15 text-cobalt-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2 py-0.5 text-[11px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps): JSX.Element {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
