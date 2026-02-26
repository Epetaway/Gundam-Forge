'use client';

import { ChevronRight, Ellipsis, Minus, Plus } from 'lucide-react';
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
        'group rounded-[6px] border border-[#2a3444] bg-[#1c2330] p-2 text-[#e6edf8] shadow-[0_10px_24px_rgba(2,6,23,0.32)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#4c90fa] hover:shadow-[0_16px_32px_rgba(2,6,23,0.52)]',
        className,
      )}
    >
      <div className="flex items-center justify-between text-[11px] font-semibold leading-none">
        <span className="truncate pr-2">{card.name}</span>
        <button
          aria-label={`Card menu for ${card.name}`}
          className="rounded-[3px] p-0.5 text-[#9aa9bf] transition-colors hover:bg-[#111827] hover:text-[#e6edf8]"
          type="button"
        >
          <Ellipsis className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] text-[#9aa9bf]">
        <span>Qty: {qty}</span>
        <span>{card.id}</span>
      </div>

      <div className="relative mt-1.5 overflow-hidden rounded-[6px] border border-[#3a475c] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <button
          aria-label={`Open ${card.name}`}
          className="block w-full text-left"
          onClick={onOpen}
          type="button"
        >
          <div className="relative aspect-[5/7] w-full">
            <CardArtImage card={card} className="h-full w-full object-cover" fill sizes="(max-width: 1024px) 45vw, 18vw" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        </button>

        <span className="absolute left-2 top-1 rounded bg-black/55 px-1.5 py-0.5 text-sm font-bold leading-none text-white">{qty}</span>

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          <div className="overflow-hidden rounded-[4px] border border-white/60 bg-black/30 backdrop-blur-[1px]">
            <button
              aria-label={`Add ${card.name}`}
              className="flex h-8 w-8 items-center justify-center border-b border-white/60 text-white transition-colors hover:bg-white/20 active:scale-95"
              onClick={onAdd}
              type="button"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              aria-label={`Remove ${card.name}`}
              className="flex h-8 w-8 items-center justify-center text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-40"
              disabled={qty === 0}
              onClick={onRemove}
              type="button"
            >
              <Minus className="h-5 w-5" />
            </button>
          </div>

          <button
            aria-label={`Open details for ${card.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/60 bg-black/35 text-white backdrop-blur-[1px] transition-colors hover:bg-white/20 active:scale-95"
            onClick={onOpen}
            type="button"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
