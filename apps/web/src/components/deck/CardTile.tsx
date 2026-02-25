import React, { useCallback } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { CardImage } from '../ui/CardImage';

interface CardTileProps {
  card: CardDefinition;
  qty?: number;
  selected?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  onQuickAdd?: () => void;
  onQuickRemove?: () => void;
  onInspect?: () => void;
  showActions?: boolean;
  lazy?: boolean;
}

export const CardTile = React.memo(function CardTile({
  card,
  qty = 0,
  selected = false,
  onClick,
  onDoubleClick,
  onQuickAdd,
  onQuickRemove,
  onInspect,
  showActions = true,
  lazy = true,
}: CardTileProps) {
  const handleAction = useCallback(
    (e: React.MouseEvent, fn?: () => void) => {
      e.stopPropagation();
      fn?.();
    },
    [],
  );

  return (
    <div
      className="cursor-pointer group"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
        if (e.key === ' ' && onDoubleClick) {
          e.preventDefault();
          onDoubleClick();
        }
      }}
    >
      <div
        className="gf-card-tile bg-gf-white"
        data-selected={selected || undefined}
      >
        <div className="relative w-full" style={{ aspectRatio: '5/7' }}>
          <CardImage
            card={card}
            className="absolute inset-0 w-full h-full object-cover"
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
          />

          {/* Type badge (Moxfield-style) */}
          <span className="gf-card-type-badge" data-type={card.type}>
            {card.type}
          </span>

          {/* Qty + Cost badges (top right) */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-[3]">
            {qty > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded bg-gf-dark/80 px-1 text-[9px] font-bold text-white">
                {qty}x
              </span>
            )}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gf-gray-800/80 text-[9px] font-bold text-white">
              {card.cost}
            </span>
          </div>

          {/* Floating action rail (Moxfield-style) */}
          {showActions && (
            <div className="gf-action-rail">
              {onQuickAdd && (
                <button
                  className="gf-action-rail-btn gf-rail-add"
                  onClick={(e) => handleAction(e, onQuickAdd)}
                  aria-label={`Add ${card.name} to deck`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              {onQuickRemove && qty > 0 && (
                <button
                  className="gf-action-rail-btn gf-rail-remove"
                  onClick={(e) => handleAction(e, onQuickRemove)}
                  aria-label={`Remove ${card.name} from deck`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              {onInspect && (
                <button
                  className="gf-action-rail-btn gf-rail-inspect"
                  onClick={(e) => handleAction(e, onInspect)}
                  aria-label={`Inspect ${card.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-1 truncate text-[11px] font-medium text-gf-text leading-tight">{card.name}</p>
      <p className="truncate text-[9px] text-gf-text-muted">{card.color} · {card.set}</p>
    </div>
  );
});
