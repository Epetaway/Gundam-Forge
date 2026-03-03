'use client';

import type { CardDefinition } from '@gundam-forge/shared';
import { UnifiedCardTile } from '@/components/cards/UnifiedCardTile';

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
    <UnifiedCardTile
      card={card}
      mode="reference"
      qty={qty}
      className={className}
      onAdd={onAdd}
      onRemove={onRemove}
      onOpen={onOpen}
    />
  );
}

