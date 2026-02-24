import React from 'react';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  count?: number;
}

export const FilterChip = React.memo(function FilterChip({
  label,
  active,
  onClick,
  color,
  count,
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
        'transition-colors cursor-pointer',
        active
          ? 'bg-gf-blue-50 text-gf-blue-600 shadow-[0_0_0_1px_var(--gf-blue-200)]'
          : 'bg-gf-surface text-gf-text-secondary shadow-[0_0_0_1px_rgba(0,0,0,0.07)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.15)] hover:bg-gf-gray-50',
      ].join(' ')}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      {label}
      {count != null && (
        <span className="text-xs text-gf-text-muted">({count})</span>
      )}
    </button>
  );
});
