'use client';

/**
 * CardStackTile — Visual stacked card tile for the deck workspace.
 *
 * Renders a full card-image tile with a physical "stack depth" effect:
 *   qty = 1 → single card, no layers
 *   qty = 2 → one offset layer behind main card
 *   qty ≥ 3 → two offset layers behind main card
 *
 * Quantity badge is always shown in builder mode.
 * Hover controls (+/−/view) appear on desktop hover, always visible on mobile.
 */

import * as React from 'react';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { ActionRail } from '@/components/cards/primitives';
import { cn } from '@/lib/utils/cn';
import type { DeckViewItem } from '@/lib/deck/sortFilter';

interface CardStackTileProps {
  item: DeckViewItem;
  mode: 'viewer' | 'builder';
  isActive?: boolean;
  onOpen: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function CardStackTile({
  item,
  mode,
  isActive,
  onOpen,
  onAdd,
  onRemove,
}: CardStackTileProps): JSX.Element {
  const showLayers = item.qty >= 2;
  const showSecondLayer = item.qty >= 3;

  return (
    /*
     * Outer wrapper: adds right/bottom padding to visually expose the stack
     * layers that extend beyond the main card frame.
     */
    <div
      className={cn(
        'group relative',
        showLayers ? 'pb-[8px] pr-[12px]' : '',
        showSecondLayer ? 'pb-[10px] pr-[16px]' : '',
      )}
    >
      {/* Layer 2 (qty ≥ 3) — deepest, most offset */}
      {showSecondLayer && (
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[12px] translate-y-[8px] rounded-[10px] border border-border bg-surface-elevated/60"
        />
      )}

      {/* Layer 1 (qty ≥ 2) — middle offset */}
      {showLayers && (
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[6px] translate-y-[4px] rounded-[10px] border border-border bg-surface-elevated"
        />
      )}

      {/* Main card face */}
      <div
        className={cn(
          'relative aspect-[5/7] w-full overflow-hidden rounded-[10px] border border-border bg-black',
          'shadow-md transition-all duration-150 group-hover:shadow-lg group-hover:-translate-y-[2px]',
          isActive ? 'ring-2 ring-cobalt-400/70' : '',
        )}
      >
        {/* Card art */}
        <CardArtImage
          card={item}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Full-area click target for opening card preview */}
        <button
          type="button"
          className="absolute inset-0 z-0"
          onClick={onOpen}
          aria-label={`View ${item.name}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen();
            }
          }}
        />

        {/* Quantity badge — top-right corner */}
        {(mode === 'builder' || item.qty > 1) && (
          <span
            className="pointer-events-none absolute right-1.5 top-1.5 z-10 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-white"
            aria-label={`Quantity: ${item.qty}`}
          >
            ×{item.qty}
          </span>
        )}

        {/* Action controls — builder mode only */}
        {mode === 'builder' && (
          <ActionRail
            name={item.name}
            qty={item.qty}
            onAdd={onAdd}
            onRemove={onRemove}
            onOpen={onOpen}
          />
        )}
      </div>

      {/* Card name below tile */}
      <p className="mt-1 truncate text-[11px] font-medium text-foreground" title={item.name}>
        {item.name}
      </p>
    </div>
  );
}
