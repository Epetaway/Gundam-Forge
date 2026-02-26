'use client';

import { ChevronRight, Minus, Plus } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

type CardRef = Pick<CardDefinition, 'id' | 'name' | 'type' | 'color' | 'cost' | 'imageUrl' | 'placeholderArt'>;

interface ReferenceCardTileProps {
  card: CardRef;
  qty?: number;
  className?: string;
  onAdd?: () => void;
  onRemove?: () => void;
  onOpen?: () => void;
}

export function ReferenceCardTile({
  card,
  qty = 0,
  className,
  onAdd,
  onRemove,
  onOpen,
}: ReferenceCardTileProps): JSX.Element {
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

      {/* Card info — clicking opens detail */}
      <button
        aria-label={`Open ${card.name}`}
        className="min-w-0 flex-1 text-left"
        onClick={onOpen}
        type="button"
      >
        <p className="truncate text-[13px] font-semibold leading-tight">{card.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-steel-600">
          {card.id} · {card.type}
        </p>
      </button>

      {/* Cost chip — always visible */}
      <span className="flex-none rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] font-bold text-steel-700">
        {card.cost}
      </span>

      {/* Qty — static count badge, only when in deck */}
      {qty > 0 ? (
        <span className="w-5 text-center font-mono text-xs font-bold tabular-nums text-foreground">
          {qty}
        </span>
      ) : null}

      {/* +/– controls — visible only on group hover / focus-within */}
      <div
        className={cn(
          'flex flex-none items-center gap-1',
          'opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 focus-within:opacity-100',
        )}
      >
        <button
          aria-label={`Remove ${card.name}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-steel-600 transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
          disabled={qty === 0}
          onClick={onRemove}
          type="button"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          aria-label={`Add ${card.name}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-steel-600 transition-colors hover:bg-surface-muted hover:text-foreground"
          onClick={onAdd}
          type="button"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Open detail — always visible */}
      <button
        aria-label={`Open details for ${card.name}`}
        className="flex-none rounded p-0.5 text-steel-600 transition-colors hover:text-cobalt-300"
        onClick={onOpen}
        type="button"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </article>
  );
}
