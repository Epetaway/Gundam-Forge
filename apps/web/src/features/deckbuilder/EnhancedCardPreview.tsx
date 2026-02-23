import { useState } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { resolveCardImage } from '../../utils/resolveCardImage';
import { useBrokenImageStore } from '../../utils/brokenImageStore';
import { useDeckStore } from './deckStore';

interface EnhancedCardPreviewProps {
  card: CardDefinition | undefined;
  onInspect?: (cardId: string) => void;
}

export function EnhancedCardPreview({ card, onInspect }: EnhancedCardPreviewProps) {
  const deckEntries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);

  const [activeTab, setActiveTab] = useState<'details' | 'lore'>('details');

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gf-light mb-4">
          <svg className="h-7 w-7 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>
        <h2 className="font-heading text-sm font-bold text-gf-text uppercase tracking-wide">Card Details</h2>
        <p className="mt-1 text-xs text-gf-text-secondary">Click any card to view details</p>
      </div>
    );
  }

  const qty = deckEntries.find((entry) => entry.cardId === card.id)?.qty ?? 0;
  const imageSrc = resolveCardImage(card);
  const markBroken = useBrokenImageStore.getState().markBroken;
  const isBroken = useBrokenImageStore.getState().brokenIds[card.id];
  const marketPrice = card.price?.market;

  const rarityLabel = (card as unknown as Record<string, unknown>).rarity as string || 'Common';
  const rarityColors: Record<string, string> = {
    'Common': 'text-gf-text-muted',
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
          <svg className="h-4 w-4 text-gf-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="font-heading text-sm font-bold text-gf-text tracking-wide uppercase">Card Details</h2>
        </div>
        <button className="flex h-6 w-6 items-center justify-center rounded text-gf-text-muted hover:bg-gf-light gf-transition">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Card Image */}
        <div
          className="relative mx-4 mt-4 overflow-hidden rounded-xl border border-gf-border shadow-sm bg-gradient-to-b from-gray-100 to-gray-200 cursor-pointer group"
          onClick={() => onInspect?.(card.id)}
        >
          {isBroken ? (
            <div className="flex items-center justify-center h-64 text-gf-text-secondary text-xs">
              Image unavailable
            </div>
          ) : (
            <>
              <img
                src={imageSrc}
                alt={card.name}
                className="h-auto w-full object-cover fade-in"
                loading="lazy"
                decoding="async"
                onError={() => markBroken(card.id)}
                onLoad={(e) => {
                  (e.target as HTMLImageElement).classList.add('fade-in');
                }}
              />
              {/* Hover overlay for inspection */}
              <div className="absolute inset-0 bg-gf-dark/0 group-hover:bg-gf-dark/10 gf-transition flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 gf-transition bg-white/90 rounded-lg px-3 py-1.5 shadow text-xs font-medium text-gf-text">
                  Click to inspect
                </div>
              </div>
            </>
          )}
          {/* Cost overlay */}
          <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-gf-blue text-sm font-bold text-white shadow-lg">
            {card.cost}
          </div>
        </div>

        {/* Card Name & Type */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-heading text-base font-bold text-gf-text">{card.name}</h3>
          <p className="text-xs text-gf-text-secondary mt-0.5">
            {card.type} — {card.color}
          </p>
        </div>

        {/* AP / HP Stats */}
        {(card.ap !== undefined || card.hp !== undefined) && (card.ap || card.hp) ? (
          <div className="px-4 pb-3">
            <div className="inline-flex items-center gap-3 rounded-lg bg-gf-dark px-3 py-1.5">
              {card.ap !== undefined && (
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {card.ap} AP
                </span>
              )}
              {card.ap !== undefined && card.hp !== undefined && (
                <span className="text-gray-600 text-xs">/</span>
              )}
              {card.hp !== undefined && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
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
            <p className="rounded-lg bg-gf-light border border-gf-border p-3 text-xs leading-relaxed text-gf-text">
              {card.text}
            </p>
          </div>
        )}

        {/* Price */}
        {marketPrice !== undefined && (
          <div className="px-4 pb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gf-text">${marketPrice.toFixed(2)}</span>
              <span className="text-[10px] text-green-600 font-medium">+12%</span>
            </div>
            <p className="text-[10px] text-gf-text-muted">Market Price</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => addCard(card.id)}
            disabled={qty >= 4}
            className="gf-btn gf-btn-primary flex-1 text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add to Deck
          </button>
          <button
            onClick={() => removeCard(card.id)}
            disabled={qty === 0}
            className="gf-btn gf-btn-danger flex-1 text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
            Remove
          </button>
        </div>

        {/* Quantity Display */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gf-border bg-gf-light px-4 py-2">
            <span className="text-sm font-bold text-gf-text tabular-nums">{qty}x</span>
            <span className="text-[10px] text-gf-text-muted">in deck</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <div className="flex border-b border-gf-border">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 text-xs font-medium border-b-2 gf-transition ${
                activeTab === 'details'
                  ? 'border-gf-blue text-gf-blue'
                  : 'border-transparent text-gf-text-muted hover:text-gf-text'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('lore')}
              className={`flex-1 py-2 text-xs font-medium border-b-2 gf-transition ${
                activeTab === 'lore'
                  ? 'border-gf-blue text-gf-blue'
                  : 'border-transparent text-gf-text-muted hover:text-gf-text'
              }`}
            >
              Lore
            </button>
          </div>
        </div>

        {/* Tab Content - Metadata Table */}
        <div className="px-4 py-3 pb-6">
          {activeTab === 'details' ? (
            <div className="space-y-0">
              {[
                { label: 'Rarity', value: <span className={`text-xs font-bold ${rarityColors[rarityLabel] || 'text-gf-text-muted'}`}>{rarityLabel}</span> },
                { label: 'Set', value: <span className="text-xs font-medium text-gf-text">{card.set}</span> },
                { label: 'Type', value: <span className="text-xs font-medium text-gf-text">{card.type}</span> },
                { label: 'Cost', value: (
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gf-blue text-[9px] font-bold text-white">
                      {card.cost}
                    </div>
                  </div>
                )},
                ...(card.ap !== undefined ? [{ label: 'Attack Points', value: <span className="text-xs font-medium text-gf-text">{card.ap}</span> }] : []),
                ...(card.hp !== undefined ? [{ label: 'Hit Points', value: <span className="text-xs font-medium text-gf-text">{card.hp}</span> }] : []),
                ...(card.traits && card.traits.length > 0 ? [{ label: 'Traits', value: <span className="text-xs font-medium text-gf-text">{card.traits.join(', ')}</span> }] : []),
                { label: 'ID', value: <span className="text-[10px] font-mono text-gf-text-muted">{card.id}</span> },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between py-2 ${i > 0 ? 'border-t border-gf-border/50' : ''}`}>
                  <span className="text-[10px] text-gf-text-muted uppercase tracking-wide">{row.label}</span>
                  {row.value}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-gf-text-secondary italic leading-relaxed">
                {card.text || 'No lore information available for this card.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
