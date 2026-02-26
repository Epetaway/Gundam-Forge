'use client';

import { ChevronRight, Minus, Plus } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

type CardRef = Pick<CardDefinition, 'id' | 'name' | 'type' | 'color' | 'cost' | 'imageUrl' | 'placeholderArt'>;

interface CardPanelProps {
  card: CardRef;
  qty?: number;
  className?: string;
  onAdd?: () => void;
  onRemove?: () => void;
  onOpen?: () => void;
}

export function CardPanel({
  card,
  qty = 0,
  className,
  onAdd,
  onRemove,
  onOpen,
}: CardPanelProps): JSX.Element {
  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-border bg-surface-muted shadow-md transition-all duration-150 hover:border-cobalt-400/60 hover:shadow-lg',
        className,
      )}
    >
      {/* ── PanelHeader — 52 px ─────────────────────────────────── */}
      <div className="flex h-[52px] flex-none items-center gap-2 border-b border-border px-3">
        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-foreground">{card.name}</p>
          <p className="mt-0.5 truncate text-[11px] leading-none text-steel-600">
            {card.id} · {card.type} · {card.color}
          </p>
        </div>

        {/* Qty pill — only visible when in deck */}
        {qty > 0 ? (
          <span className="flex-none rounded-full bg-cobalt-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-cobalt-300 ring-1 ring-cobalt-400/40">
            ×{qty}
          </span>
        ) : null}

        {/* Cost chip */}
        <span className="flex-none rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] font-bold text-steel-700">
          {card.cost}
        </span>
      </div>

      {/* ── CardStage — 5:7 aspect ratio, card as the hero ─────── */}
      <div className="relative aspect-[5/7] w-full overflow-hidden bg-black">

        {/* Card image — click opens detail modal */}
        <button
          aria-label={`Open ${card.name}`}
          className="absolute inset-0 block"
          onClick={onOpen}
          type="button"
        >
          <CardArtImage
            card={card}
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1280px) 42vw, 22vw"
          />
        </button>

        {/* Qty overlay badge */}
        {qty > 0 ? (
          <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full bg-black/65 px-2 py-0.5 font-mono text-[11px] font-bold leading-none text-white backdrop-blur-sm">
            {qty}
          </span>
        ) : null}

        {/* ActionRail — right-anchored, vertically centred, hover-revealed */}
        <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          {/* Add / Remove stacked pair */}
          <div className="overflow-hidden rounded-[6px] border border-white/25 bg-black/55 backdrop-blur-[2px]">
            <button
              aria-label={`Add ${card.name}`}
              className="flex h-11 w-11 items-center justify-center border-b border-white/25 text-white transition-colors hover:bg-white/15 active:scale-[0.96]"
              onClick={onAdd}
              type="button"
            >
              <Plus className="h-[18px] w-[18px]" />
            </button>
            <button
              aria-label={`Remove ${card.name}`}
              className="flex h-11 w-11 items-center justify-center text-white transition-colors hover:bg-white/15 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
              disabled={qty === 0}
              onClick={onRemove}
              type="button"
            >
              <Minus className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Detail / zoom button */}
          <button
            aria-label={`Open details for ${card.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-white/25 bg-black/55 text-white backdrop-blur-[2px] transition-colors hover:bg-white/15 active:scale-[0.96]"
            onClick={onOpen}
            type="button"
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}
