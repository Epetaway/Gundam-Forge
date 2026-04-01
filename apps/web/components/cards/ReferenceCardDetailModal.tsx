'use client';

import type { CardDefinition } from '@gundam-forge/shared';
import type { CardDetailModalCard } from '@/components/cards/CardDetailModal';
import { CardDetailModal } from '@/components/cards/CardDetailModal';

type CardRef = Pick<CardDefinition, 'id' | 'name' | 'type' | 'color' | 'cost' | 'set' | 'text' | 'imageUrl' | 'placeholderArt'>;

interface ReferenceCardDetailModalProps {
  card: CardRef | null;
  open: boolean;
  qty: number;
  onOpenChange: (open: boolean) => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function ReferenceCardDetailModal({
  card,
  open,
  qty,
  onOpenChange,
  onAdd,
  onRemove,
}: ReferenceCardDetailModalProps): JSX.Element {
  const normalizedCard: CardDetailModalCard | null = card
    ? {
        ...card,
        color: card.color ?? 'Colorless',
        set: card.set ?? 'Unknown',
        text: card.text ?? '',
      }
    : null;

  return (
    <CardDetailModal
      card={normalizedCard}
      open={open}
      onOpenChange={onOpenChange}
      context="cards"
      qty={qty}
      onAdd={onAdd}
      onRemove={onRemove}
    />
  );
}
