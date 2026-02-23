import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { CardDefinition } from '@gundam-forge/shared';
import { resolveCardImage } from '../../utils/resolveCardImage';
import { useBrokenImageStore } from '../../utils/brokenImageStore';
import { useDeckStore } from './deckStore';

interface CardInspectionModalProps {
  card: CardDefinition | undefined;
  open: boolean;
  onClose: () => void;
}

export function CardInspectionModal({ card, open, onClose }: CardInspectionModalProps) {
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);
  const deckEntries = useDeckStore((state) => state.entries);

  const [activeTab, setActiveTab] = useState<'details' | 'lore'>('details');

  if (!card) return null;

  const qty = deckEntries.find((e) => e.cardId === card.id)?.qty ?? 0;
  const imageSrc = resolveCardImage(card);
  const isBroken = useBrokenImageStore.getState().brokenIds[card.id];
  const markBroken = useBrokenImageStore.getState().markBroken;
  const marketPrice = card.price?.market;
  const rarityLabel = (card as unknown as Record<string, unknown>).rarity as string || 'Common';

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="gf-modal-backdrop" />
        <Dialog.Content
          className="gf-modal-content"
          aria-describedby={undefined}
        >
          {/* Inspection Header */}
          <div className="gf-inspection-header">
            <div className="gf-inspection-dot" />
            <span>Inspection Mode</span>
            <div className="flex-1" />
            <Dialog.Close asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded text-gf-text-muted hover:bg-gf-light gf-transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Modal Body: Left image + Right metadata */}
          <div className="flex max-h-[calc(100vh-180px)] overflow-hidden">
            {/* Left: Large Card Image */}
            <div className="w-[380px] flex-shrink-0 bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-6">
              {isBroken ? (
                <div className="flex items-center justify-center h-full text-gf-text-secondary text-sm">
                  Image unavailable
                </div>
              ) : (
                <img
                  src={imageSrc}
                  alt={card.name}
                  className="max-h-[500px] w-auto rounded-xl shadow-lg object-contain"
                  onError={() => markBroken(card.id)}
                />
              )}
            </div>

            {/* Right: Metadata + Tabs */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-4">
                {/* Name + Type */}
                <div>
                  <Dialog.Title className="font-heading text-xl font-bold text-gf-text">
                    {card.name}
                  </Dialog.Title>
                  <p className="text-sm text-gf-text-secondary mt-1">
                    {card.type} — {card.color}
                  </p>
                </div>

                {/* AP / HP */}
                {(card.ap !== undefined || card.hp !== undefined) && (card.ap || card.hp) ? (
                  <div className="inline-flex items-center gap-3 rounded-lg bg-gf-dark px-4 py-2">
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
                ) : null}

                {/* Rules Text */}
                {card.text && (
                  <div className="rounded-lg bg-gf-light border border-gf-border p-4">
                    <p className="text-sm leading-relaxed text-gf-text">{card.text}</p>
                  </div>
                )}

                {/* Price */}
                {marketPrice !== undefined && (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gf-text">${marketPrice.toFixed(2)}</span>
                      <span className="text-xs text-green-600 font-medium">+12%</span>
                    </div>
                    <p className="text-xs text-gf-text-muted mt-0.5">Market Price</p>
                  </div>
                )}

                {/* Tabs */}
                <div>
                  <div className="flex border-b border-gf-border">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`py-2 px-4 text-sm font-medium border-b-2 gf-transition ${
                        activeTab === 'details'
                          ? 'border-gf-blue text-gf-blue'
                          : 'border-transparent text-gf-text-muted hover:text-gf-text'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setActiveTab('lore')}
                      className={`py-2 px-4 text-sm font-medium border-b-2 gf-transition ${
                        activeTab === 'lore'
                          ? 'border-gf-blue text-gf-blue'
                          : 'border-transparent text-gf-text-muted hover:text-gf-text'
                      }`}
                    >
                      Lore
                    </button>
                  </div>

                  <div className="pt-3">
                    {activeTab === 'details' ? (
                      <div className="space-y-0">
                        {[
                          { label: 'Rarity', value: rarityLabel },
                          { label: 'Set', value: card.set },
                          { label: 'Type', value: card.type },
                          { label: 'Color', value: card.color },
                          { label: 'Cost', value: String(card.cost) },
                          ...(card.ap !== undefined ? [{ label: 'Attack Points', value: String(card.ap) }] : []),
                          ...(card.hp !== undefined ? [{ label: 'Hit Points', value: String(card.hp) }] : []),
                          ...(card.traits && card.traits.length > 0 ? [{ label: 'Traits', value: card.traits.join(', ') }] : []),
                          { label: 'Card ID', value: card.id },
                        ].map((row, i) => (
                          <div key={i} className={`flex items-center justify-between py-2.5 ${i > 0 ? 'border-t border-gf-border/50' : ''}`}>
                            <span className="text-xs text-gf-text-muted uppercase tracking-wide">{row.label}</span>
                            <span className="text-sm font-medium text-gf-text">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-sm text-gf-text-secondary italic leading-relaxed">
                          {card.text || 'No lore information available for this card.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between border-t border-gf-border px-6 py-3 bg-gf-light">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gf-text tabular-nums">{qty}x</span>
              <span className="text-xs text-gf-text-muted">in deck</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeCard(card.id)}
                disabled={qty === 0}
                className="gf-btn gf-btn-danger text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Remove
              </button>
              <button
                onClick={() => addCard(card.id)}
                disabled={qty >= 4}
                className="gf-btn gf-btn-primary gf-btn-cut text-xs py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add to Deck
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
