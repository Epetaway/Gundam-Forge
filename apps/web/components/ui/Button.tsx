import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-semibold transition-all duration-150 ease-out outline-none ring-offset-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-cobalt-400/70 bg-accent text-accent-foreground shadow-[0_8px_20px_rgba(37,99,235,0.32)] hover:-translate-y-px hover:bg-cobalt-400 hover:shadow-[0_12px_26px_rgba(59,130,246,0.42)]',
        secondary:
          'border-border bg-surface-interactive text-foreground shadow-sm hover:-translate-y-px hover:border-cobalt-400/40 hover:bg-steel-200',
        ghost: 'border-transparent text-steel-700 shadow-none hover:bg-steel-200/80 hover:text-foreground',
        destructive:
          'border-red-500/70 bg-destructive text-destructive-foreground shadow-[0_8px_20px_rgba(220,38,38,0.28)] hover:-translate-y-px hover:bg-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
