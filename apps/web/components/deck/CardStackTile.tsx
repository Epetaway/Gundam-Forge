'use client';

/**
 * CardStackTile — Visual stacked card tile for the deck workspace.
 *
 * Renders a full card-image tile with a physical "stack depth" effect:
 *   qty = 1 → single card, no layers
 *   qty = 2 → one offset layer behind main card
 *   qty ≥ 3 → two offset layers behind main card
 *
 * Controls per breakpoint:
 *   mobile (< sm) → compact +/− dock anchored bottom-right, always visible
 *   desktop (sm+) → ActionRail revealed on group-hover (no redundant chevron)
 *
 * Quantity badge is always shown in builder mode.
 */

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { getCardImage } from '@/lib/data/cards';
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
     * Outer wrapper: no padding — the main card is w-full at full grid cell size.
     * Stack layers use absolute inset-0 + translate, extending into the grid gap.
     */
    <div className="group relative">
      {/* Layer 2 (qty ≥ 3) — deepest, most offset */}
      {showSecondLayer && (
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[12px] translate-y-[8px] overflow-hidden rounded-md border border-border opacity-50"
        >
          <img src={getCardImage(item)} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Layer 1 (qty ≥ 2) — middle offset */}
      {showLayers && (
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-[6px] translate-y-[4px] overflow-hidden rounded-md border border-border opacity-70"
        >
          <img src={getCardImage(item)} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Main card face */}
      <div
        className={cn(
          'relative aspect-[5/7] w-full overflow-hidden rounded-md border border-border bg-black',
          'shadow-md transition-all duration-150 group-hover:shadow-lg group-hover:-translate-y-[2px]',
          isActive ? 'ring-2 ring-cobalt-400/70' : '',
        )}
      >
        {/* Card art */}
        <img
          src={getCardImage(item)}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          loading="lazy"
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

        {mode === 'builder' && (
          <>
            {/*
             * Mobile compact dock — always visible, anchored bottom-right.
             * Tap-friendly size (28×28). Hidden on sm+ where ActionRail takes over.
             * Chevron (view) omitted — tapping the card face already opens preview.
             */}
            <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 sm:hidden">
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove one ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-black/75 text-white backdrop-blur-sm transition-colors hover:bg-black/90 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              )}
              {onAdd && (
                <button
                  type="button"
                  aria-label={`Add one ${item.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-black/75 text-white backdrop-blur-sm transition-colors hover:bg-black/90 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); onAdd(); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/*
             * Desktop ActionRail — hidden on mobile, revealed on group-hover.
             * No onOpen passed (redundant with card-face tap-to-preview).
             */}
            <div className="hidden sm:block">
              <ActionRail
                name={item.name}
                qty={item.qty}
                onAdd={onAdd}
                onRemove={onRemove}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
