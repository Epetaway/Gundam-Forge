import React from 'react';

type LEDStatus = 'valid' | 'warning' | 'error';

interface LEDProps {
  status: LEDStatus;
  label?: string;
  className?: string;
}

const statusLabels: Record<LEDStatus, string> = {
  valid: 'Valid',
  warning: 'Warning',
  error: 'Error',
};

export function LED({ status, label, className = '' }: LEDProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={label || statusLabels[status]}
    >
      <span className="gf-led" data-status={status} aria-hidden="true" />
      {label && (
        <span className="text-xs font-medium text-gf-text-secondary">
          {label}
        </span>
      )}
    </span>
  );
}
