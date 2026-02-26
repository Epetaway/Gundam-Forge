'use client';

import { ChevronRight, Minus, Plus } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

type CardRef = Pick<
  CardDefinition,
  'id' | 'name' | 'type' | 'color' | 'cost' | 'imageUrl' | 'placeholderArt' | 'price'
>;

interface CollectionCardTileProps {
  card: CardRef;
  qty?: number;
  className?: string;
  onAdd?: () => void;
  onRemove?: () => void;
  onOpen?: () => void;
}

export function CollectionCardTile({
  card,
  qty = 0,
  className,
  onAdd,
  onRemove,
  onOpen,
}: CollectionCardTileProps): JSX.Element {
  const marketPrice = card.price?.market;

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-border bg-surface-muted transition-all duration-150 hover:border-cobalt-400/50 hover:shadow-md',
        className,
      )}
    >
      {/* ── CardStage — image is the hero ─────────────────────── */}
      <div className="relative aspect-[5/7] overflow-hidden bg-black">

        {/* Primary click target → detail modal */}
        <button
          aria-label={`View ${card.name}`}
          className="absolute inset-0 block"
          onClick={onOpen}
          type="button"
        >
          <CardArtImage
            card={card}
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 22vw, 17vw"
          />
        </button>

        {/* Qty badge — visible only in deck-building contexts */}
        {qty > 0 ? (
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-sm bg-black/65 px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-white backdrop-blur-sm">
            {qty}
          </span>
        ) : null}

        {/* ActionRail — right edge, hover/focus-revealed */}
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          {(onAdd ?? onRemove) ? (
            <div className="overflow-hidden rounded-[5px] border border-white/25 bg-black/55 backdrop-blur-[2px]">
              {onAdd ? (
                <button
                  aria-label={`Add ${card.name}`}
                  className="flex h-10 w-10 items-center justify-center border-b border-white/25 text-white transition-colors hover:bg-white/15 active:scale-[0.96]"
                  onClick={onAdd}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : null}
              {onRemove ? (
                <button
                  aria-label={`Remove ${card.name}`}
                  className="flex h-10 w-10 items-center justify-center text-white transition-colors hover:bg-white/15 active:scale-[0.96] disabled:opacity-30"
                  disabled={qty === 0}
                  onClick={onRemove}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : null}

          {/* View detail */}
          <button
            aria-label={`Open details for ${card.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-white/25 bg-black/55 text-white backdrop-blur-[2px] transition-colors hover:bg-white/15 active:scale-[0.96]"
            onClick={onOpen}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Meta row ──────────────────────────────────────────── */}
      <div className="px-2 py-1.5">
        <p className="truncate text-[12px] font-semibold leading-tight text-foreground">{card.name}</p>
        <p className="mt-0.5 truncate text-[10px] text-steel-600">{card.id} · {card.type}</p>
      </div>

      {/* ── Price / cost footer ───────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-border px-2 py-1">
        {marketPrice !== undefined ? (
          <span className="font-mono text-[10px] text-steel-600">${marketPrice.toFixed(2)}</span>
        ) : (
          <span className="text-[10px] text-steel-400">—</span>
        )}
        <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] font-bold text-steel-700">
          {card.cost}
        </span>
      </div>
    </article>
  );
}
