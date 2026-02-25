import React, { useState } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { IconButton } from '../ui/IconButton';
import { Tabs } from '../ui/Tabs';
import { EmptyState } from '../ui/EmptyState';
import { CardImage } from '../ui/CardImage';

interface CardDetailsDockProps {
  card: CardDefinition | null;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onInspect: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  Common: 'text-gf-text-muted',
  Uncommon: 'text-gf-success',
  Rare: 'text-gf-blue',
  'Super Rare': 'text-gf-warning',
  'Secret Rare': 'text-card-purple',
};

export function CardDetailsDock({
  card,
  qty,
  onAdd,
  onRemove,
  onInspect,
}: CardDetailsDockProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!card) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="No card selected"
          description="Select a card from the catalog or deck list to view details."
        />
      </div>
    );
  }

  return (
    <div key={card.id} className="flex flex-col h-full gf-animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gf-border">
        <span className="text-xs font-medium text-gf-gray-400 uppercase tracking-wide">Card Detail</span>
      </div>

      {/* Card Image */}
      <div className="p-4 flex-shrink-0">
        <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '5/7' }}>
          <CardImage
            card={card}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        </div>
      </div>

      {/* Card Info */}
      <div className="px-4 pb-3 flex-shrink-0">
        <h3 className="text-base font-semibold text-gf-text leading-snug">{card.name}</h3>
        <p className="text-sm text-gf-text-secondary mt-0.5">
          {card.type} · {card.color} · Cost {card.cost}
        </p>
      </div>

      <div className="flex items-center gap-3 px-4">
        <span className="text-xs font-medium text-gf-gray-400 uppercase tracking-wide whitespace-nowrap">
          QTY · {qty}
        </span>
        <div className="flex-1 h-px bg-gf-border" />
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <IconButton
            icon={<span className="text-sm leading-none">−</span>}
            aria-label="Remove one"
            variant="default"
            size="sm"
            onClick={onRemove}
            disabled={qty <= 0}
          />
          <span className="w-8 text-center text-base font-semibold text-gf-text">
            {qty}
          </span>
          <IconButton
            icon={<span className="text-sm leading-none">+</span>}
            aria-label="Add one"
            variant="default"
            size="sm"
            onClick={onAdd}
          />
        </div>
        <IconButton
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          aria-label="Inspect card"
          variant="default"
          size="md"
          onClick={onInspect}
        />
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs
          items={[
            { id: 'details', label: 'Details' },
            { id: 'lore', label: 'Lore' },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 gf-scroll">
        {activeTab === 'details' && (
          <div className="space-y-3 text-sm">
            {card.traits && card.traits.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gf-gray-400 uppercase tracking-wide block mb-1">Traits</span>
                <div className="flex flex-wrap gap-1">
                  {card.traits.map((t) => (
                    <span key={t} className="inline-block rounded-full bg-gf-gray-100 px-2 py-0.5 text-xs text-gf-text-secondary">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {card.ap != null && (
              <div className="flex justify-between">
                <span className="text-gf-text-secondary">AP</span>
                <span className="font-medium text-gf-text">{card.ap}</span>
              </div>
            )}
            {card.hp != null && (
              <div className="flex justify-between">
                <span className="text-gf-text-secondary">HP</span>
                <span className="font-medium text-gf-text">{card.hp}</span>
              </div>
            )}
            {card.text && (
              <div>
                <span className="text-xs font-medium text-gf-gray-400 uppercase tracking-wide block mb-1">Card Text</span>
                <p className="text-gf-text-secondary leading-relaxed whitespace-pre-wrap">
                  {card.text}
                </p>
              </div>
            )}
            {card.price?.market && (
              <div className="flex justify-between pt-2 border-t border-gf-border">
                <span className="text-gf-text-secondary">Market Price</span>
                <span className="font-medium text-gf-text">${card.price.market.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
        {activeTab === 'lore' && (
          <p className="text-sm text-gf-text-muted italic">
            Lore data not available for this card.
          </p>
        )}
      </div>
    </div>
  );
}
