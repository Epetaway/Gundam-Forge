import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-border bg-steel-100 text-steel-700',
        accent: 'border-cobalt-400/40 bg-cobalt-400/10 text-cobalt-700',
        success: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-300 bg-amber-50 text-amber-700',
        destructive: 'border-red-300 bg-red-50 text-red-700',
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
