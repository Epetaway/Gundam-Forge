import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
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
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-10 w-full rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
            className,
          )}
          id={resolvedId}
          ref={ref}
          {...props}
        />
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
