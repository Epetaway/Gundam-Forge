import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { CardDefinition } from '@gundam-forge/shared';
import { CardImage } from '../../components/ui/CardImage';
import { useUIStore } from '../../stores/uiStore';
import { useCardsStore } from './cardsStore';
import { useDeckStore } from './deckStore';

type InspectTab = 'details' | 'text' | 'info';

interface CardInspectionModalProps {
  card: CardDefinition | undefined;
  open: boolean;
  onClose: () => void;
}

export function CardInspectionModal({ card, open, onClose }: CardInspectionModalProps) {
  const addCard = useDeckStore((s) => s.addCard);
  const removeCard = useDeckStore((s) => s.removeCard);
  const deckEntries = useDeckStore((s) => s.entries);
  const allCards = useCardsStore((s) => s.cards);

  const [activeTab, setActiveTab] = useState<InspectTab>('details');

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (!card) return;
      const idx = allCards.findIndex((c) => c.id === card.id);
      if (idx === -1) return;
      const next = allCards[idx + dir];
      if (next) {
        useUIStore.getState().openInspection(next.id);
      }
    },
    [card, allCards],
  );

  if (!card) return null;

  const qty = deckEntries.find((e) => e.cardId === card.id)?.qty ?? 0;
  const marketPrice = card.price?.market;
  const rarityLabel = (card as unknown as Record<string, unknown>).rarity as string || 'Common';

  const cardIdx = allCards.findIndex((c) => c.id === card.id);
  const hasPrev = cardIdx > 0;
  const hasNext = cardIdx < allCards.length - 1;

  const tabs: { id: InspectTab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'text', label: 'Card Text' },
    { id: 'info', label: 'Card Info' },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="gf-modal-backdrop" />
        <Dialog.Content
          className="gf-inspect-modal"
          aria-describedby={undefined}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-gf-border px-5 py-3">
            <div className="flex items-center gap-2">

              <Dialog.Title className="font-heading text-lg font-bold text-gf-text leading-tight">
                {card.name}
              </Dialog.Title>
              <span className="gf-card-type-badge relative" data-type={card.type} style={{ position: 'relative', top: 0, left: 0 }}>
                {card.type}
              </span>
            </div>
            <Dialog.Close asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-gf-text-muted hover:bg-gf-light hover:text-gf-text gf-transition" aria-label="Close">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Tab navigation */}
          <div className="gf-inspect-tabs px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className="gf-inspect-tab"
                data-active={activeTab === tab.id ? 'true' : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body: Left image + Right controls */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: Card Image */}
            <div className="w-[340px] flex-shrink-0 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-5 border-r border-gf-border">
              <CardImage
                card={card}
                className="max-h-[420px] w-auto rounded-xl shadow-lg object-contain"
              />
              {/* Price below image (Moxfield-style) */}
              {marketPrice !== undefined && (
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between rounded-lg bg-gf-white border border-gf-border px-3 py-2">
                    <span className="text-xs text-gf-text-muted">Market</span>
                    <span className="text-sm font-bold text-gf-text">${marketPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls + Tab content */}
            <div className="flex-1 flex flex-col overflow-y-auto gf-scroll">
              {/* Quantity controls (Moxfield-style) */}
              <div className="p-5 border-b border-gf-border">
                <label className="text-xs font-medium text-gf-text-muted uppercase tracking-wide mb-2 block">
                  Quantity in Deck
                </label>
                <div className="flex items-center gap-3">
                  <button
                    className="gf-qty-btn gf-qty-btn-remove"
                    onClick={() => removeCard(card.id)}
                    disabled={qty === 0}
                    aria-label="Remove one"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <div className="flex h-9 w-14 items-center justify-center rounded-lg border border-gf-border bg-gf-light text-base font-bold text-gf-text tabular-nums">
                    {qty}
                  </div>
                  <button
                    className="gf-qty-btn gf-qty-btn-add"
                    onClick={() => addCard(card.id)}
                    disabled={qty >= 4}
                    aria-label="Add one"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <span className="text-xs text-gf-text-muted ml-1">/ 4 max</span>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 p-5">
                {activeTab === 'details' && (
                  <div className="space-y-3">
                    {/* AP / HP stats */}
                    {(card.ap !== undefined || card.hp !== undefined) && (card.ap || card.hp) && (
                      <div className="flex items-center gap-4 rounded-lg bg-gf-dark px-4 py-2.5 w-fit">
                        {card.ap !== undefined && (
                          <span className="flex items-center gap-1.5 text-sm font-bold text-yellow-400">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {card.ap} AP
                          </span>
                        )}
                        {card.ap !== undefined && card.hp !== undefined && (
                          <span className="text-gray-600">/</span>
                        )}
                        {card.hp !== undefined && (
                          <span className="flex items-center gap-1.5 text-sm font-bold text-red-400">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            {card.hp} HP
                          </span>
                        )}
                      </div>
                    )}

                    {/* Detail rows */}
                    <div className="divide-y divide-gf-border/50">
                      {[
                        { label: 'Color', value: card.color },
                        { label: 'Cost', value: String(card.cost) },
                        { label: 'Type', value: card.type },
                        { label: 'Rarity', value: rarityLabel },
                        { label: 'Set', value: card.set },
                        ...(card.ap !== undefined ? [{ label: 'Attack Points', value: String(card.ap) }] : []),
                        ...(card.hp !== undefined ? [{ label: 'Hit Points', value: String(card.hp) }] : []),
                        ...(card.zone ? [{ label: 'Zone', value: card.zone }] : []),
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between py-2.5">
                          <span className="text-xs text-gf-text-muted uppercase tracking-wide">{row.label}</span>
                          <span className="text-sm font-medium text-gf-text">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Traits as chips */}
                    {card.traits && card.traits.length > 0 && (
                      <div>
                        <span className="text-xs text-gf-text-muted uppercase tracking-wide block mb-2">Traits</span>
                        <div className="flex flex-wrap gap-1.5">
                          {card.traits.map((trait) => (
                            <span
                              key={trait}
                              className="rounded-md border border-gf-border bg-gf-light px-2.5 py-1 text-[11px] font-medium text-gf-text"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'text' && (
                  <div>
                    {card.text ? (
                      <div className="rounded-lg bg-gf-light border border-gf-border p-4">
                        <p className="text-sm leading-relaxed text-gf-text whitespace-pre-wrap">{card.text}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gf-text-muted italic">No card text available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="divide-y divide-gf-border/50">
                    {[
                      { label: 'Card ID', value: card.id },
                      { label: 'Set', value: card.set },
                      ...(card.level !== undefined ? [{ label: 'Level', value: String(card.level) }] : []),
                      ...(card.linkCondition ? [{ label: 'Link Condition', value: card.linkCondition }] : []),
                      ...(card.apModifier !== undefined ? [{ label: 'AP Modifier', value: `+${card.apModifier}` }] : []),
                      ...(card.hpModifier !== undefined ? [{ label: 'HP Modifier', value: `+${card.hpModifier}` }] : []),
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5">
                        <span className="text-xs text-gf-text-muted uppercase tracking-wide">{row.label}</span>
                        <span className="text-sm font-medium text-gf-text font-mono">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom navigation bar (prev/next) */}
          <div className="flex items-center justify-between border-t border-gf-border px-5 py-2.5 bg-gf-light">
            <button
              className="gf-btn gf-btn-ghost gf-btn-sm gap-1"
              onClick={() => navigate(-1)}
              disabled={!hasPrev}
              aria-label="Previous card"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </button>
            <span className="text-[10px] text-gf-text-muted font-mono">
              {cardIdx + 1} / {allCards.length}
            </span>
            <button
              className="gf-btn gf-btn-ghost gf-btn-sm gap-1"
              onClick={() => navigate(1)}
              disabled={!hasNext}
              aria-label="Next card"
            >
              Next
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
