'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils/cn';

interface ZoneContainerProps {
  /** dnd-kit droppable id. If omitted, zone is not droppable. */
  zoneId?: string;
  zoneData?: Record<string, unknown>;
  label: string;
  count?: number;
  isOpponent?: boolean;
  /** Tailwind class for the container background. Defaults to bg-slate-800/70 */
  bg?: string;
  /** Tailwind class for min-height */
  minH?: string;
  className?: string;
  children: React.ReactNode;
}

export function ZoneContainer({
  zoneId,
  zoneData,
  label,
  count,
  isOpponent = false,
  bg = 'bg-slate-800/70',
  minH = 'min-h-[80px]',
  className,
  children,
}: ZoneContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: zoneId ?? `zone-${label}-disabled`,
    disabled: !zoneId,
    data: zoneData,
  });

  return (
    <div
      ref={zoneId ? setNodeRef : undefined}
      className={cn(
        'relative flex flex-col rounded-lg border-2 p-2 transition-colors duration-150',
        bg,
        minH,
        isOver
          ? 'border-green-400 bg-green-900/20'
          : 'border-slate-600/50 hover:border-slate-500/70',
        className,
      )}
      aria-label={`${isOpponent ? 'Opponent ' : ''}${label} zone`}
      data-zone={zoneId}
      data-opponent={isOpponent}
    >
      {/* Zone label */}
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 select-none">
        {label}
        {count !== undefined && (
          <span className="ml-1 text-slate-300">({count})</span>
        )}
      </span>

      {/* Zone content */}
      <div className="flex flex-1 flex-wrap gap-1">
        {children}
      </div>

      {/* Drop indicator overlay */}
      {isOver && (
        <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-green-400/60 bg-green-400/5" />
      )}
    </div>
  );
}
