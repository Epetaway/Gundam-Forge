'use client';

import { ChevronRight, Minus, Plus } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { CARD_SIZE_TOKENS } from '@/lib/design-system/card-sizes';
import { cn } from '@/lib/utils/cn';

type CardRef = Pick<CardDefinition, 'id' | 'name' | 'type' | 'color' | 'cost' | 'imageUrl' | 'placeholderArt'>;

type ScoredCard = CardDefinition & { synergyScore?: number; synergyReasons?: any[] };

interface UnifiedCardTileProps {
  card: CardRef | ScoredCard;
  mode: 'reference' | 'deckbuilder';
  qty?: number;
  className?: string;
  onAdd?: () => void;
  onRemove?: () => void;
  onOpen?: () => void;
  onPreview?: (cardId: string) => void;
  showSynergy?: boolean;
  onHoverChange?: (hovered: { card: ScoredCard; anchor: DOMRect } | null) => void;
}

export function UnifiedCardTile({
  card,
  mode,
  qty = 0,
  className,
  onAdd,
  onRemove,
  onOpen,
  onPreview,
  showSynergy = false,
  onHoverChange,
}: UnifiedCardTileProps): JSX.Element {
  // Deckbuilder mode: Grid tile with image-first layout
  if (mode === 'deckbuilder') {
    const scoredCard = card as ScoredCard;
    return (
      <button
        type="button"
        className={cn(
          'group relative aspect-[5/7] overflow-hidden rounded-md border border-border bg-black transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
          className,
        )}
        onClick={() => onPreview?.(card.id)}
        onMouseEnter={(e) => {
          if (onHoverChange && 'synergyScore' in card) {
            onHoverChange({ card: card as ScoredCard, anchor: e.currentTarget.getBoundingClientRect() });
          }
        }}
        onMouseLeave={() => {
          if (onHoverChange) {
            onHoverChange(null);
          }
        }}
        aria-label={`Preview ${card.name}`}
        title="Click to preview · + to add"
      >
        <img
          src={card.imageUrl || card.placeholderArt || '/card_art/placeholder.png'}
          alt={card.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />

        {/* Synergy badge — deckbuilder mode only */}
        {showSynergy && 'synergyScore' in card && scoredCard.synergyScore !== undefined && (
          <div className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-cobalt-600 text-xs font-bold text-white">
            {Math.round(scoredCard.synergyScore)}
          </div>
        )}

        {/* Overlay and label */}
        <div className="pointer-events-none absolute inset-0 hidden bg-black/40 opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100" />
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 transform rounded bg-black/70 px-2 py-1 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Click to Preview
        </div>

        {/* Add button */}
        <button
          type="button"
          aria-label={`Add ${card.name} to deck`}
          title="Add to deck"
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.();
          }}
          className="absolute bottom-1 right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-cobalt-600 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-300 hover:bg-cobalt-500 sm:opacity-0"
        >
          <span className="text-sm font-bold">+</span>
        </button>
      </button>
    );
  }

  // Reference mode: Horizontal list tile
  return (
    <article
      className={cn(
        'group flex items-center gap-2 rounded-[6px] border border-border bg-surface-muted px-2 py-1.5 text-foreground',
        'transition-all duration-150 hover:border-cobalt-400/60 hover:bg-surface-interactive',
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-10 flex-none overflow-hidden rounded-[3px] border border-steel-400 bg-black">
        <CardArtImage card={card} className="h-full w-full object-cover" fill sizes="40px" />
      </div>

      {/* Card info */}
      <button
        aria-label={`Open ${card.name}`}
        className="min-w-0 flex-1 text-left"
        onClick={onOpen}
        type="button"
      >
        <p className="truncate text-[13px] font-semibold leading-tight">{card.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-text-muted">
          {card.id} · {card.type}
        </p>
      </button>

      {/* Cost chip */}
      <span className="flex-none rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] font-bold text-text-secondary">
        {card.cost}
      </span>

      {/* Qty badge */}
      {qty > 0 ? (
        <span className="w-5 text-center font-mono text-xs font-bold tabular-nums text-foreground">
          {qty}
        </span>
      ) : null}

      {/* +/– controls */}
      <div
        className={cn(
          'flex flex-none items-center gap-1',
          'opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 focus-within:opacity-100',
        )}
      >
        <button
          aria-label={`Remove ${card.name}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
          disabled={qty === 0}
          onClick={onRemove}
          type="button"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          aria-label={`Add ${card.name}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          onClick={onAdd}
          type="button"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Open detail chevron */}
      <button
        aria-label={`Open details for ${card.name}`}
        className="flex-none rounded p-0.5 text-text-muted transition-colors hover:text-cobalt-300"
        onClick={onOpen}
        type="button"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </article>
  );
}
