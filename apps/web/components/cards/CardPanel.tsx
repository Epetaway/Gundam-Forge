'use client';

import type { CardDefinition } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';
import { ActionRail, CardMetaCompact, CardPoster, QtyBadge } from '@/components/cards/primitives';

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
    <div className={cn('group relative', className)}>
      <CardPoster
        card={card}
        onClick={onOpen}
        sizes="(max-width: 768px) 90vw, (max-width: 1280px) 42vw, 22vw"
      >
        <QtyBadge mode="builder" qty={qty} />
        <ActionRail
          name={card.name}
          onAdd={onAdd}
          onOpen={onOpen}
          onRemove={onRemove}
          qty={qty}
        />
      </CardPoster>

      <CardMetaCompact
        name={card.name}
        sub={`${card.type} · ${card.color} · ${card.cost}`}
      />
    </div>
  );
}
