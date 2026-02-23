import { useState } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { resolveCardImage } from '../../utils/resolveCardImage';
import { useBrokenImageStore } from '../../utils/brokenImageStore';
import { useDeckStore } from './deckStore';

interface CardGridProps {
  cards: CardDefinition[];
  selectedCardId?: string;
  onCardSelect: (cardId: string) => void;
}

export function CardGrid({ cards, selectedCardId, onCardSelect }: CardGridProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const deckEntries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const brokenIds = useBrokenImageStore((state) => state.brokenIds);
  const markBroken = useBrokenImageStore((state) => state.markBroken);

  const qtyByCardId = new Map(deckEntries.map((entry) => [entry.cardId, entry.qty] as const));

  const colorClasses: Record<string, string> = {
    White: 'bg-white',
    Blue: 'bg-card-blue',
    Red: 'bg-card-red',
    Green: 'bg-card-green',
    Black: 'bg-card-black',
    Colorless: 'bg-gray-400',
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => {
        if (brokenIds[card.id]) return null;

        const qty = qtyByCardId.get(card.id) ?? 0;
        const isSelected = selectedCardId === card.id;
        const isHovered = hoveredCardId === card.id;
        const imageSrc = resolveCardImage(card);

        return (
          <div
            key={card.id}
            className="group relative cursor-pointer"
            onMouseEnter={() => setHoveredCardId(card.id)}
            onMouseLeave={() => setHoveredCardId(null)}
            onClick={() => onCardSelect(card.id)}
          >
            {/* Card Image Container */}
            <div
              className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                isSelected
                  ? 'border-gcg-primary shadow-lg scale-105'
                  : 'border-gcg-border hover:border-gcg-primary hover:shadow-md'
              } ${isHovered ? 'z-20' : ''}`}
            >
              {/* Image */}
              <div className="relative w-full pb-[140%] bg-gradient-to-b from-gray-200 to-gray-300">
                <img
                  src={imageSrc}
                  alt={card.name}
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 20vw"
                  onError={() => {
                    markBroken(card.id);
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).classList.add('fade-in');
                  }}
                />

                {/* Cost Badge */}
                <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gcg-border text-xs font-bold text-gcg-text shadow-sm">
                  {card.cost}
                </div>

                {/* Power Badge (if exists) */}
                {card.power !== undefined && card.power  !== null && card.power > 0 && (
                  <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gcg-border text-xs font-bold text-gcg-text shadow-sm">
                    {card.power}
                  </div>
                )}

                {/* Price Badge (if exists) */}
                {card.price?.market !== undefined && (
                  <div className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-green-500 border border-green-600 text-white shadow-sm px-2 py-1 text-xs font-bold">
                    ${card.price.market.toFixed(2)}
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute bottom-2 left-2 rounded bg-white/90 border border-gcg-border px-2 py-1 text-xs font-medium text-gcg-text">
                  {card.type}
                </div>

                {/* Color Indicator */}
                <div
                  className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-white ${colorClasses[card.color] || colorClasses.Colorless} shadow-sm`}
                  title={card.color}
                />
              </div>
            </div>

            {/* Card Name */}
            <div className="mt-2">
              <h3 className="truncate text-xs font-semibold leading-tight text-gcg-text transition-colors group-hover:text-gcg-primary">
                {card.name}
              </h3>
              <p className="text-xs text-gray-500">{card.id}</p>
            </div>

            {/* Deck Count & Add Button */}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addCard(card.id);
                }}
                className={`flex-1 rounded border px-2 py-1 text-xs font-medium transition-colors ${
                  qty >= 3
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gcg-primary bg-gcg-primary text-white hover:bg-gcg-hover'
                }`}
                disabled={qty >= 3}
              >
                {qty >= 3 ? 'MAX' : 'ADD'}
              </button>
              {qty > 0 && (
                <div className={`flex h-6 w-6 items-center justify-center rounded border text-xs font-bold ${
                  qty >= 3 ? 'border-gcg-primary bg-gcg-primary text-white' : 'border-gcg-border bg-white text-gcg-text'
                }`}>
                  {qty}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
