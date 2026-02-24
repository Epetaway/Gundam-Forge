import React from 'react';

type IconButtonVariant = 'default' | 'ghost' | 'destructive';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: React.ReactNode;
  'aria-label': string;
  loading?: boolean;
  badge?: number;
}

const sizeMap: Record<IconButtonSize, string> = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-10 h-10 text-lg',
};

const variantMap: Record<IconButtonVariant, string> = {
  default: 'gf-btn-secondary',
  ghost: 'gf-btn-ghost',
  destructive: 'gf-btn-destructive',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      icon,
      loading = false,
      badge,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'gf-btn relative rounded-md p-0',
      variantMap[variant],
      sizeMap[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="gf-autosave-spinner" aria-hidden="true" />
        ) : (
          icon
        )}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gf-blue px-1 text-[10px] font-semibold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
