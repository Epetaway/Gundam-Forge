import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  status?: 'default' | 'complete' | 'warning';
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  status = 'default',
  label,
  className = '',
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gf-text-secondary">{label}</span>
          <span className="text-xs text-gf-gray-400">
            {value}/{max}
          </span>
        </div>
      )}
      <div
        className="gf-progress-bar"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="gf-progress-fill"
          data-status={status === 'default' ? undefined : status}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
