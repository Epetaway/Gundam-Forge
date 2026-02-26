'use client';

import { cn } from '@/lib/utils/cn';
import { ActionRail, CardMetaCompact, CardPoster, QtyBadge } from '@/components/cards/primitives';
import type { DeckDensity, DeckViewItem } from '@/lib/deck/sortFilter';

interface CardTileProps {
  item: DeckViewItem;
  /** viewer → image only, click opens modal; builder → hover ActionRail with +/–/› */
  mode: 'viewer' | 'builder';
  density?: DeckDensity;
  isActive?: boolean;
  onOpen: () => void;
  /** Builder mode only. */
  onAdd?: () => void;
  /** Builder mode only. */
  onRemove?: () => void;
}

export function CardTile({
  item,
  mode,
  density,
  isActive,
  onOpen,
  onAdd,
  onRemove,
}: CardTileProps): JSX.Element {
  return (
    <div className={cn('group relative', isActive && 'rounded-md ring-2 ring-cobalt-400/70')}>
      {/* Layer 1: Card face */}
      <CardPoster
        card={item}
        onClick={onOpen}
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 20vw, 16vw"
      >
        {/* Qty badge — hidden in viewer mode when qty === 1 */}
        <QtyBadge mode={mode} qty={item.qty} />

        {/* Layer 2: Action overlay — builder mode only */}
        {mode === 'builder' ? (
          <ActionRail
            name={item.name}
            onAdd={onAdd}
            onOpen={onOpen}
            onRemove={onRemove}
            qty={item.qty}
          />
        ) : null}
      </CardPoster>

      {/* Compact meta below card */}
      <CardMetaCompact
        className={density === 'compact' ? 'space-y-0' : undefined}
        name={item.name}
        sub={`${item.typeLine} · ${item.cmc}`}
      />
    </div>
  );
}
