import React from 'react';

type PanelVariant = 'default' | 'flat' | 'inset';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
}

const variantClasses: Record<PanelVariant, string> = {
  default: 'gf-panel',
  flat: 'gf-panel-flat',
  inset: 'gf-panel-inset',
};

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      variant = 'default',
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const classes = [variantClasses[variant], className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  },
);

Panel.displayName = 'Panel';
