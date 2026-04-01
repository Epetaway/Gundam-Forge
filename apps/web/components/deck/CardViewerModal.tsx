'use client';

import * as React from 'react';
import { CardDetailModal, type CardDetailModalCard } from '@/components/cards/CardDetailModal';
import type { DeckViewItem } from '@/lib/deck/sortFilter';

interface CardViewerModalProps {
  items: DeckViewItem[];
  activeCardId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectCard: (cardId: string) => void;
}

export function CardViewerModal({
  items,
  activeCardId,
  onOpenChange,
  onSelectCard,
}: CardViewerModalProps): JSX.Element {
  const normalizedCards = React.useMemo<CardDetailModalCard[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.typeLine,
        color: item.color ?? 'Colorless',
        cost: typeof item.cost === 'number' ? item.cost : item.cmc,
        set: item.set ?? 'Unknown',
        text: item.text ?? '',
        imageUrl: item.imageUrl,
        placeholderArt: item.placeholderArt,
        ap: item.ap,
        hp: item.hp,
        level: item.level,
        traits: item.traits,
        linkCondition: item.linkCondition,
        apModifier: item.apModifier,
        hpModifier: item.hpModifier,
      })),
    [items],
  );

  const activeCard = React.useMemo(
    () => normalizedCards.find((card) => card.id === activeCardId) ?? null,
    [activeCardId, normalizedCards],
  );

  const activeQty = React.useMemo(
    () => items.find((item) => item.id === activeCardId)?.qty ?? 0,
    [activeCardId, items],
  );

  return (
    <CardDetailModal
      card={activeCard}
      context="cards"
      onOpenChange={onOpenChange}
      onSelectCard={onSelectCard}
      open={activeCardId !== null}
      qty={activeQty}
      allCards={normalizedCards}
    />
  );
}
