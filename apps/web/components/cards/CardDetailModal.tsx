'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Minus, Plus, ChevronLeft, ChevronRight, Copy, TrendingUp } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogDescription, DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/Dialog';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { Button } from '@/components/ui/Button';
import { CARD_SIZE_TOKENS } from '@/lib/design-system/card-sizes';
import { useSwipeToClose } from '@/lib/hooks/useSwipeToClose';
import { features } from '@/lib/features/feature-flags';

interface CardDetailModalProps {
  card: CardDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Context mode: 'deckbuilder' or 'cards'
  context?: 'deckbuilder' | 'cards';
  // Deck builder specific - card count and actions
  qty?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  // Navigation (for catalog preview)
  allCards?: CardDefinition[];
  onSelectCard?: (cardId: string) => void;
}

/**
 * Universal card detail modal component
 * Works in both deck builder (with add/remove) and cards page contexts
 * Supports keyboard navigation and responsive design
 */
export function CardDetailModal({
  card,
  open,
  onOpenChange,
  context = 'deckbuilder',
  qty = 0,
  onAdd,
  onRemove,
  allCards = [],
  onSelectCard,
}: CardDetailModalProps): JSX.Element {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Enable swipe-to-close gesture on mobile
  useSwipeToClose(contentRef, {
    threshold: 50,
    onClose: () => onOpenChange(false),
  });

  // Calculate navigation state
  const currentIndex = React.useMemo(
    () => (card && allCards.length > 0 ? allCards.findIndex((c) => c.id === card.id) : -1),
    [card, allCards]
  );
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < allCards.length - 1;

  // Handle copy card ID to clipboard
  const handleCopyCardId = async () => {
    if (!card?.id) return;
    try {
      await navigator.clipboard.writeText(card.id);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error('Failed to copy card ID:', error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
      if (e.key === 'ArrowLeft' && canGoPrev && onSelectCard && allCards[currentIndex - 1]) {
        e.preventDefault();
        onSelectCard(allCards[currentIndex - 1].id);
      }
      if (e.key === 'ArrowRight' && canGoNext && onSelectCard && allCards[currentIndex + 1]) {
        e.preventDefault();
        onSelectCard(allCards[currentIndex + 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, canGoPrev, canGoNext, allCards, onSelectCard, onOpenChange]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={contentRef}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-elevated focus:outline-none data-[state=closed]:animate-zoom-out data-[state=open]:animate-zoom-in sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88svh] sm:w-[min(820px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md sm:border sm:border-cobalt-400/35 lg:w-[min(900px,88vw)]"
        >
        {card ? (
          <>
            {/* Header */}
            <DialogHeader className="flex-shrink-0 border-b border-border bg-surface-muted px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl font-semibold md:text-2xl">
                    {card.name}
                    {/* Trending Badge (feature-flagged) */}
                    {features.trending() && (
                      <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-sm font-medium text-amber-300">
                        <TrendingUp className="h-3 w-3" />
                        Trending
                      </span>
                    )}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs md:text-sm">
                    {card.id} • {card.color} • {card.type} • Cost {card.cost}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Copy Card ID Button (feature-flagged) */}
                  {features.copyCopyCardId() && (
                    <button
                      onClick={handleCopyCardId}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-surface-elevated"
                      aria-label="Copy card ID"
                      title={copyFeedback ? 'Copied!' : 'Copy card ID'}
                    >
                      <Copy className={`h-5 w-5 ${copyFeedback ? 'text-green-400' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-surface-elevated"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Content - single scrollable column on mobile, two-column on desktop */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
              {/* Image column - small centered image on mobile, fixed left panel on desktop */}
              <div className="flex-shrink-0 bg-black p-4 md:w-80 md:border-r md:border-border">
                <div className="relative mx-auto aspect-[5/7] w-full max-w-[160px] overflow-hidden rounded-md border border-border md:max-w-none">
                  <CardArtImage
                    card={card}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(max-width: 768px) 160px, 320px"
                    priority
                  />
                </div>
              </div>

              {/* Details column - visible on all screens, scrollable on desktop */}
              <div className="flex-1 space-y-4 bg-surface-muted/50 p-4 md:overflow-y-auto md:p-6">
                {/* Type & Stats */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Type</p>
                  <p className="text-sm font-medium text-foreground">{card.type}</p>
                </div>

                {/* Price History (feature-flagged) */}
                {features.priceHistory() && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Price History</p>
                    <div className="rounded border border-border bg-surface p-3">
                      <p className="text-xs text-steel-600">Market data unavailable</p>
                      <p className="mt-2 text-xs text-foreground">Price tracking coming soon</p>
                    </div>
                  </div>
                )}

                {/* Combat Stats */}
                {(card.ap !== undefined || card.hp !== undefined || card.level !== undefined) && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Stats</p>
                    <div className="grid grid-cols-3 gap-2">
                      {card.level !== undefined && (
                        <div className="rounded border border-border bg-surface px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-steel-600">Level</p>
                          <p className="text-lg font-bold tabular-nums text-foreground">{card.level}</p>
                        </div>
                      )}
                      {card.ap !== undefined && (
                        <div className="rounded border border-border bg-surface px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-steel-600">AP</p>
                          <p className="text-lg font-bold tabular-nums text-foreground">{card.ap}</p>
                        </div>
                      )}
                      {card.hp !== undefined && (
                        <div className="rounded border border-border bg-surface px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-steel-600">HP</p>
                          <p className="text-lg font-bold tabular-nums text-foreground">{card.hp}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pilot Modifiers */}
                {(card.apModifier !== undefined || card.hpModifier !== undefined) && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Modifiers</p>
                    <div className="grid grid-cols-2 gap-2">
                      {card.apModifier !== undefined && (
                        <div className="rounded border border-cobalt-400/30 bg-cobalt-500/10 px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-steel-600">AP Mod</p>
                          <p className="text-lg font-bold tabular-nums text-cobalt-300">
                            {card.apModifier > 0 ? '+' : ''}
                            {card.apModifier}
                          </p>
                        </div>
                      )}
                      {card.hpModifier !== undefined && (
                        <div className="rounded border border-cobalt-400/30 bg-cobalt-500/10 px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-steel-600">HP Mod</p>
                          <p className="text-lg font-bold tabular-nums text-cobalt-300">
                            {card.hpModifier > 0 ? '+' : ''}
                            {card.hpModifier}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Traits */}
                {card.traits && card.traits.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Traits</p>
                    <p className="text-sm text-foreground">{card.traits.join(' • ')}</p>
                  </div>
                )}

                {/* Link Condition */}
                {card.linkCondition && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Link Condition</p>
                    <p className="text-sm text-foreground">{card.linkCondition}</p>
                  </div>
                )}

                {/* Keywords */}
                {card.keywords && card.keywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {card.keywords.map((kw) => (
                        <span key={kw} className="rounded bg-cobalt-500/20 px-2 py-1 text-xs font-medium text-cobalt-300">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Triggers */}
                {card.triggers && card.triggers.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Triggers</p>
                    <div className="flex flex-wrap gap-1">
                      {card.triggers.map((tr) => (
                        <span key={tr} className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">
                          {tr}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clans/Factions */}
                {card.clans && card.clans.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Factions</p>
                    <div className="flex flex-wrap gap-1">
                      {card.clans.map((clan) => (
                        <span key={clan} className="rounded bg-cobalt-500/20 px-2 py-1 text-xs font-medium text-cobalt-300">
                          {clan}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules Text */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Rules Text</p>
                  <div className="rounded border border-border bg-surface p-3">
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {card.text?.trim() ? card.text : 'No rules text available for this card.'}
                    </p>
                  </div>
                </div>

                {/* Playtest Actions (feature-flagged) */}
                {features.playtestActions() && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Playtest Actions</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">Play</span>
                      {card.type?.includes('Pilot') && (
                        <span className="rounded bg-cobalt-500/20 px-2 py-1 text-xs font-medium text-cobalt-300">Link</span>
                      )}
                      {card.ap !== undefined && (
                        <span className="rounded bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-300">Attack</span>
                      )}
                      <span className="rounded bg-steel-500/20 px-2 py-1 text-xs font-medium text-steel-300">Resource</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 flex-col gap-3 border-t border-border bg-surface-muted px-4 py-3 md:px-6 md:py-4">
              {/* Compare Cards Button (feature-flagged) */}
              {features.compareCards() && (
                <Button variant="secondary" className="w-full">
                  Compare with Another Card
                </Button>
              )}

              {/* Navigation buttons (if allCards provided) */}
              {allCards.length > 1 && (
                <div className="flex gap-2">
                  <Button
                    disabled={!canGoPrev}
                    onClick={() => canGoPrev && onSelectCard && onSelectCard(allCards[currentIndex - 1].id)}
                    size="sm"
                    variant="secondary"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    disabled={!canGoNext}
                    onClick={() => canGoNext && onSelectCard && onSelectCard(allCards[currentIndex + 1].id)}
                    size="sm"
                    variant="secondary"
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Add/Remove controls (deck builder context only) */}
              {context === 'deckbuilder' && (
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 rounded border border-border bg-surface px-2">
                    <button
                      onClick={onRemove}
                      disabled={qty === 0}
                      className="inline-flex h-8 w-8 items-center justify-center text-foreground hover:bg-surface-elevated disabled:opacity-40"
                      aria-label={`Remove ${card.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      value={qty}
                      readOnly
                      className="w-8 bg-transparent text-center text-sm font-semibold text-foreground"
                      aria-label={`Quantity of ${card.name}`}
                    />
                    <button
                      onClick={onAdd}
                      className="inline-flex h-8 w-8 items-center justify-center text-foreground hover:bg-surface-elevated"
                      aria-label={`Add ${card.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <Button onClick={onAdd} className="flex-1">
                    Add to Deck
                  </Button>

                  <Button onClick={() => onOpenChange(false)} variant="secondary">
                    Close
                  </Button>
                </div>
              )}

              {/* Cards page context */}
              {context === 'cards' && (
                <Button onClick={() => onOpenChange(false)} variant="secondary" className="w-full">
                  Close
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-sm text-steel-600">No card selected.</div>
        )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
