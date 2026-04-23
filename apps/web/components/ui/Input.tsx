import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, description, error, id, startIcon, endIcon, ...props }, ref) => {
    const resolvedId = id ?? props.name ?? 'input-field';
    const describedBy = error
      ? `${resolvedId}-error`
      : description
        ? `${resolvedId}-description`
        : undefined;

    return (
      <div className="grid gap-2">
        {label ? (
          <label className="text-sm font-medium text-foreground" htmlFor={resolvedId}>
            {label}
          </label>
        ) : null}
        <div className="relative">
          {startIcon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" aria-hidden="true">
              {startIcon}
            </span>
          ) : null}
          <input
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            className={cn(
              'h-11 min-h-[44px] w-full rounded-md border border-border bg-surface-interactive px-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50',
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
              className,
            )}
            id={resolvedId}
            ref={ref}
            {...props}
          />
          {endIcon ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-steel-500" aria-hidden="true">
              {endIcon}
            </span>
          ) : null}
        </div>
        {description && !error ? (
          <p className="text-xs text-steel-600" id={`${resolvedId}-description`}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-destructive" id={`${resolvedId}-error`} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
