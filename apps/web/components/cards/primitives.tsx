'use client';

/**
 * Shared card UI primitives used across viewer and builder contexts.
 *
 * CardPoster       — the image face of a card (always visible, click = open)
 * CardMetaCompact  — 1-2 line name + subtitle rendered below a poster
 * QtyBadge         — absolute deck-qty badge inside a poster
 * ActionRail       — right-side hover overlay with Add / Remove / Open
 */

import * as React from 'react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

// ─── shared ref type ────────────────────────────────────────────────────────

export type CardPosterRef = {
  id: string;
  name: string;
  imageUrl?: string;
  placeholderArt?: string;
};

// ─── CardPoster ──────────────────────────────────────────────────────────────
// The pure image face of a card. Renders the art at aspect-[5/7].
// When onClick is provided, an absolute full-area <button> handles the tap.
// Pass QtyBadge and/or ActionRail as children — they render above the button.

interface CardPosterProps {
  card: CardPosterRef;
  onClick?: () => void;
  sizes?: string;
  /** Extra classes on the outer frame div (border-radius, shadows, etc.) */
  className?: string;
  children?: React.ReactNode;
}

export function CardPoster({
  card,
  onClick,
  sizes,
  className,
  children,
}: CardPosterProps): JSX.Element {
  return (
    <div
      className={cn(
        'relative aspect-[5/7] w-full overflow-hidden rounded-md border border-border bg-black',
        'shadow-md transition-all duration-150 group-hover:shadow-lg',
        className,
      )}
    >
      {/* Card art */}
      <CardArtImage
        card={card}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        fill
        sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw'}
      />

      {/* Full-area click target — sits above the image */}
      {onClick ? (
        <button
          aria-label={`Open ${card.name}`}
          className="absolute inset-0 z-0"
          onClick={onClick}
          type="button"
        />
      ) : null}

      {/* Badges / rails — rendered at z-10, above the click target */}
      {children}
    </div>
  );
}

// ─── CardMetaCompact ─────────────────────────────────────────────────────────
// 1-2 line text block rendered below a CardPoster.

interface CardMetaCompactProps {
  name: string;
  /** e.g. "Unit · 3" or "ST01-001 · Blue" */
  sub?: string;
  className?: string;
}

export function CardMetaCompact({ name, sub, className }: CardMetaCompactProps): JSX.Element {
  return (
    <div className={cn('space-y-0.5 pt-1', className)}>
      <p className="truncate text-xs font-semibold text-foreground">{name}</p>
      {sub ? <p className="truncate text-[10px] text-steel-600">{sub}</p> : null}
    </div>
  );
}

// ─── QtyBadge ────────────────────────────────────────────────────────────────
// Absolute-positioned deck-qty badge. Place inside a CardPoster.
// viewer mode: hidden when qty === 1 (single copy is the default expectation)
// builder mode: shown whenever qty > 0

interface QtyBadgeProps {
  qty: number;
  mode: 'viewer' | 'builder';
}

export function QtyBadge({ qty, mode }: QtyBadgeProps): JSX.Element | null {
  if (qty <= 0) return null;
  if (mode === 'viewer' && qty === 1) return null;
  return (
    <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-white">
      x{qty}
    </span>
  );
}

// ─── ActionRail ──────────────────────────────────────────────────────────────
// Right-side vertical overlay with Add / Remove / Open pill buttons.
// Place inside a CardPoster — the poster's outer div must have class "group".
//
// Visibility:
//   mobile (< sm)  → always visible
//   sm and above   → opacity-0 by default, revealed on group-hover

interface ActionRailProps {
  name: string;
  qty: number;
  onAdd?: () => void;
  onRemove?: () => void;
  onOpen?: () => void;
}

export function ActionRail({
  name,
  qty,
  onAdd,
  onRemove,
  onOpen,
}: ActionRailProps): JSX.Element {
  return (
    <div
      className={cn(
        'absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2',
        // Mobile: always reachable
        'pointer-events-auto opacity-100',
        // sm+: fade out, reveal on card hover
        'sm:pointer-events-none sm:opacity-0 sm:transition-opacity sm:duration-150',
        'sm:group-hover:pointer-events-auto sm:group-hover:opacity-100',
      )}
    >
      {/* Add / Remove pill */}
      {(onAdd || onRemove) ? (
        <div className="overflow-hidden rounded-[6px] border border-white/25 bg-black/60 backdrop-blur-[2px]">
          {onAdd ? (
            <button
              aria-label={`Add ${name}`}
              className="flex h-10 w-10 items-center justify-center border-b border-white/25 text-white transition-colors hover:bg-white/15 active:scale-[0.96]"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
          {onRemove ? (
            <button
              aria-label={`Remove ${name}`}
              className="flex h-10 w-10 items-center justify-center text-white transition-colors hover:bg-white/15 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
              disabled={qty === 0}
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              type="button"
            >
              <Minus className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Open / zoom */}
      {onOpen ? (
        <button
          aria-label={`View details for ${name}`}
          className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-white/25 bg-black/60 text-white backdrop-blur-[2px] transition-colors hover:bg-white/15 active:scale-[0.96]"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
