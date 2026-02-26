'use client';

/**
 * Compact deck-workspace row used in the Forge builder sidebar.
 * Replaces the old inline "– qty +" stepper pattern.
 *
 * Layout: [thumbnail] [name / meta] [x{qty}] [hover: –+] [›]
 */

import { ChevronRight, Minus, Plus } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

type EntryCardRef = Pick<CardDefinition, 'id' | 'name' | 'cost' | 'imageUrl' | 'placeholderArt'>;

interface DeckEntryRowProps {
  card: EntryCardRef;
  qty: number;
  className?: string;
  onAdd?: () => void;
  onRemove?: () => void;
  onOpen?: () => void;
}

export function DeckEntryRow({
  card,
  qty,
  className,
  onAdd,
  onRemove,
  onOpen,
}: DeckEntryRowProps): JSX.Element {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5',
        'transition-colors hover:border-border hover:bg-surface-interactive',
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-8 flex-none overflow-hidden rounded-[3px] border border-border bg-black">
        <CardArtImage card={card} className="h-full w-full object-cover" fill sizes="32px" />
      </div>

      {/* Name + meta — click opens detail */}
      <button
        aria-label={`Inspect ${card.name}`}
        className="min-w-0 flex-1 text-left"
        onClick={onOpen}
        type="button"
      >
        <p className="truncate text-sm font-medium text-foreground">{card.name}</p>
        <p className="text-[11px] text-steel-600">{card.id} · {card.cost}</p>
      </button>

      {/* Static qty */}
      <span className="font-mono text-xs font-semibold tabular-nums text-steel-600">
        x{qty}
      </span>

      {/* +/– controls — hover-revealed, desktop only hidden by default */}
      <div
        className={cn(
          'flex items-center gap-1',
          'opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 focus-within:opacity-100',
        )}
      >
        <button
          aria-label={`Remove ${card.name}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-200 disabled:opacity-30"
          disabled={qty === 0}
          onClick={onRemove}
          type="button"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label={`Add ${card.name}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-200"
          onClick={onAdd}
          type="button"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Open — always visible, single affordance */}
      <button
        aria-label={`Open details for ${card.name}`}
        className="flex-none rounded p-0.5 text-steel-600 transition-colors hover:text-cobalt-300"
        onClick={onOpen}
        type="button"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
