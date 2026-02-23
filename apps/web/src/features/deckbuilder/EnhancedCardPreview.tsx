import { useState } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { useDeckStore } from './deckStore';

interface EnhancedCardPreviewProps {
  card: CardDefinition | undefined;
}

export function EnhancedCardPreview({ card }: EnhancedCardPreviewProps) {
  const deckEntries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);

  const [activeTab, setActiveTab] = useState<'details' | 'lore'>('details');

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gf-light mb-4">
          <svg className="h-8 w-8 text-gf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>
        <h2 className="font-heading text-base font-bold text-gf-text">Select a Card</h2>
        <p className="mt-1 text-sm text-gf-text-secondary">Click any card to view details</p>
      </div>
    );
  }

  const qty = deckEntries.find((entry) => entry.cardId === card.id)?.qty ?? 0;
  const imageSrc = card.imageUrl || card.placeholderArt;
  const marketPrice = card.price?.market;

  const rarityLabel = (card as any).rarity || 'Common';
  const rarityColors: Record<string, string> = {
    'Common': 'text-gray-500',
    'Uncommon': 'text-green-600',
    'Rare': 'text-purple-600',
    'Special Rare': 'text-red-600',
    'Super Rare': 'text-red-600',
    'Promo': 'text-pink-600',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gf-border px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="text-base font-bold text-gf-text">Card Details</h2>
        </div>
        <button className="flex h-6 w-6 items-center justify-center rounded text-gf-text-secondary hover:bg-gray-100">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Card Image */}
        <div className="relative mx-4 mt-4 overflow-hidden rounded-xl border border-gf-border shadow-sm">
          <img
            src={imageSrc}
            alt={card.name}
            className="h-auto w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://via.placeholder.com/600x800/f5f5f5/333333?text=${encodeURIComponent(card.name)}`;
            }}
          />
          {/* Cost overlay */}
          <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-gf-blue text-sm font-bold text-white shadow-lg">
            {card.cost}
          </div>
        </div>

        {/* Card Name & Type */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-heading text-lg font-bold text-gf-text">{card.name}</h3>
          <p className="text-sm text-gf-text-secondary">
            {card.type} — {card.color}
          </p>
        </div>

        {/* AP / HP Stats */}
        {(card.ap !== undefined || card.hp !== undefined) && (card.ap || card.hp) ? (
          <div className="px-4 pb-3">
            <div className="inline-flex items-center gap-3 rounded-full bg-gf-dark px-4 py-1.5">
              {card.ap !== undefined && (
                <span className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {card.ap} AP
                </span>
              )}
              {card.ap !== undefined && card.hp !== undefined && (
                <span className="text-gray-500">/</span>
              )}
              {card.hp !== undefined && (
                <span className="flex items-center gap-1 text-sm font-bold text-red-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {card.hp} HP
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Card Text */}
        {card.text && (
          <div className="px-4 pb-3">
            <p className="rounded-lg bg-gf-light border border-gf-border p-3 text-sm leading-relaxed text-gf-text">
              {card.text}
            </p>
          </div>
        )}

        {/* Price */}
        {marketPrice !== undefined && (
          <div className="px-4 pb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gf-text">${marketPrice.toFixed(2)}</span>
              <span className="text-xs text-green-600 font-medium">+12%</span>
            </div>
            <p className="text-xs text-gf-text-secondary">Market Price</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => addCard(card.id)}
            disabled={qty >= 4}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gf-blue px-3 py-2.5 text-sm font-medium text-white hover:bg-gf-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add to Deck
          </button>
          <button
            onClick={() => removeCard(card.id)}
            disabled={qty === 0}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-500 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
            Remove
          </button>
        </div>

        {/* Quantity Selector */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gf-border bg-white px-4 py-2">
            <span className="text-sm font-bold text-gf-text">{qty}x</span>
            <span className="text-xs text-gf-text-secondary">in deck</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <div className="flex border-b border-gf-border">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-gf-blue text-gf-blue'
                  : 'border-transparent text-gf-text-secondary hover:text-gf-text'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('lore')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'lore'
                  ? 'border-gf-blue text-gf-blue'
                  : 'border-transparent text-gf-text-secondary hover:text-gf-text'
              }`}
            >
              Lore
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-3 pb-6">
          {activeTab === 'details' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gf-text-secondary">Rarity</span>
                <span className={`text-xs font-bold ${rarityColors[rarityLabel] || 'text-gray-500'}`}>{rarityLabel}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-t border-gf-border">
                <span className="text-xs text-gf-text-secondary">Set</span>
                <span className="text-xs font-medium text-gf-text">{card.set}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-t border-gf-border">
                <span className="text-xs text-gf-text-secondary">Card Type</span>
                <span className="text-xs font-medium text-gf-text">{card.type}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-t border-gf-border">
                <span className="text-xs text-gf-text-secondary">Cost</span>
                <div className="flex items-center gap-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gf-blue text-[10px] font-bold text-white">
                    {card.cost}
                  </div>
                  <span className="text-xs font-medium text-gf-text">{card.cost}</span>
                </div>
              </div>
              {card.ap !== undefined && (
                <div className="flex items-center justify-between py-1.5 border-t border-gf-border">
                  <span className="text-xs text-gf-text-secondary">Attack Points</span>
                  <span className="text-xs font-medium text-gf-text">{card.ap}</span>
                </div>
              )}
              {card.hp !== undefined && (
                <div className="flex items-center justify-between py-1.5 border-t border-gf-border">
                  <span className="text-xs text-gf-text-secondary">Hit Points</span>
                  <span className="text-xs font-medium text-gf-text">{card.hp}</span>
                </div>
              )}
              {card.traits && card.traits.length > 0 && (
                <div className="flex items-center justify-between py-1.5 border-t border-gf-border">
                  <span className="text-xs text-gf-text-secondary">Traits</span>
                  <span className="text-xs font-medium text-gf-text">{card.traits.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-t border-gf-border">
                <span className="text-xs text-gf-text-secondary">ID</span>
                <span className="text-xs font-mono text-gf-text-secondary">{card.id}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gf-text-secondary italic">
                {card.text || 'No lore information available for this card.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
