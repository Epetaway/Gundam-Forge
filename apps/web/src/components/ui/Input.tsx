import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gf-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-lg bg-white py-2.5 px-3 text-sm text-gf-text outline-none',
            'shadow-[0_0_0_1px_rgba(0,0,0,0.1)]',
            'transition-shadow',
            'focus:shadow-[0_0_0_2px_var(--gf-blue-500)]',
            'placeholder:text-gf-text-muted',
            error
              ? 'shadow-[0_0_0_1px_var(--gf-error)] focus:shadow-[0_0_0_2px_var(--gf-error)]'
              : '',
            props.disabled ? 'opacity-50 cursor-not-allowed' : '',
            className,
          ].join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-gf-error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-gf-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
