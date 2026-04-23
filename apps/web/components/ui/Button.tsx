import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-semibold tracking-[0.01em] transition-all duration-150 ease-out outline-none ring-offset-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-cobalt-400/80 bg-cobalt-500 text-accent-foreground shadow-[0_10px_24px_rgba(37,99,235,0.34)] hover:-translate-y-px hover:border-cobalt-300 hover:bg-cobalt-400 hover:shadow-[0_14px_28px_rgba(59,130,246,0.44)]',
        secondary:
          'border-cobalt-900/65 bg-surface-interactive text-foreground shadow-sm hover:-translate-y-px hover:border-cobalt-400/45 hover:bg-steel-200',
        ghost: 'border-transparent text-steel-700 shadow-none hover:bg-steel-200/80 hover:text-foreground',
        destructive:
          'border-red-500/70 bg-destructive text-destructive-foreground shadow-[0_8px_20px_rgba(220,38,38,0.28)] hover:-translate-y-px hover:bg-red-500',
      },
      size: {
        sm: 'h-10 px-4 text-xs min-h-[44px] min-w-[44px]', // Touch target: 44px min
        md: 'h-11 px-4 min-h-[44px]', // Touch target: 44px (WCAG 2.5.5)
        lg: 'h-12 px-6 text-base min-h-[44px]', // Touch target: 48px
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]', // Touch target: 44x44px
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
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        aria-busy={loading ? true : undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
