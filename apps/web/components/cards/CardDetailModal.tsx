'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Minus, Plus, ChevronLeft, ChevronRight, Copy, TrendingUp, Zap, Heart, Star } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogDescription, DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/Dialog';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { Button } from '@/components/ui/Button';
import { CARD_SIZE_TOKENS } from '@/lib/design-system/card-sizes';
import { useSwipeToClose } from '@/lib/hooks/useSwipeToClose';
import { features } from '@/lib/features/feature-flags';

// Color mapping for card colors to accent accent colors
const COLOR_TO_ACCENT: Record<string, string> = {
  'White': 'from-silver-400 to-steel-400',
  'Blue': 'from-cobalt-400 to-cobalt-600',
  'Red': 'from-red-400 to-red-600',
  'Yellow': 'from-yellow-400 to-amber-600',
  'Green': 'from-emerald-400 to-emerald-600',
  'Purple': 'from-purple-400 to-purple-600',
  'Black': 'from-slate-400 to-slate-600',
} as const;

export interface CardDetailModalCard {
  id: string;
  name: string;
  type: string;
  color?: string;
  cost?: number | string;
  set?: string;
  text?: string;
  imageUrl?: string;
  placeholderArt?: string;
  ap?: number;
  hp?: number;
  level?: number;
  apModifier?: number;
  hpModifier?: number;
  traits?: string[];
  keywords?: string[];
  triggers?: string[];
  clans?: string[];
  linkCondition?: string;
  price?: {
    market?: number;
    low?: number;
    mid?: number;
    high?: number;
    foil?: number;
  };
}

interface CardDetailModalProps {
  card: CardDetailModalCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Context mode: 'deckbuilder' or 'cards'
  context?: 'deckbuilder' | 'cards';
  // Deck builder specific - card count and actions
  qty?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  // Navigation (for catalog preview)
  allCards?: CardDetailModalCard[];
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
  const [activeTab, setActiveTab] = useState<'stats' | 'details' | 'rules'>('stats');
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
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-elevated focus:outline-none data-[state=closed]:animate-zoom-out data-[state=open]:animate-zoom-in sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88svh] sm:w-[min(860px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md sm:border sm:border-cobalt-400/35 sm:shadow-[0_24px_70px_rgba(2,6,23,0.65)] lg:w-[min(960px,88vw)]"
        >
        {card ? (
          <>
            {/* Header - Redesigned with color accent */}
            <DialogHeader className="flex-shrink-0 border-b border-border bg-gradient-to-r from-cobalt-900/60 via-surface-muted to-surface px-4 py-3 md:px-6 md:py-4 relative">
              {/* Color accent left border */}
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${COLOR_TO_ACCENT[card.color as keyof typeof COLOR_TO_ACCENT] || 'from-steel-400 to-steel-600'}`} />

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="font-display text-2xl font-semibold uppercase tracking-wide md:text-3xl">
                    {card.name}
                    {/* Trending Badge (feature-flagged) */}
                    {features.trending() && (
                      <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-amber-500/30 px-3 py-1 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/40">
                        <TrendingUp className="h-4 w-4" />
                        Trending
                      </span>
                    )}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs md:text-sm text-steel-500">
                    {card.id} • <span className="text-foreground font-medium">{card.color}</span> • {card.type} • Cost <span className="font-bold text-cobalt-300">{card.cost}</span>
                  </DialogDescription>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                    {/* Type Badge - Bold */}
                    <span className="rounded border border-cobalt-400 bg-cobalt-500 px-2.5 py-1 text-cobalt-50 ring-1 ring-cobalt-400/40 shadow-sm hover:shadow-md transition-shadow">
                      {card.type}
                    </span>
                    {/* Color Badge - Dynamic color representation */}
                    <span className={`rounded border px-2.5 py-1 text-white font-medium ${'bg-gradient-to-r ' + (COLOR_TO_ACCENT[card.color as keyof typeof COLOR_TO_ACCENT] || 'from-steel-400 to-steel-600')} shadow-sm`}>
                      {card.color ?? 'Colorless'}
                    </span>
                    {/* Set Badge - Gradient */}
                    <span className="rounded border border-cobalt-400/30 bg-gradient-to-r from-surface-muted to-surface px-2.5 py-1 text-steel-400 shadow-sm">
                      Set {card.set ?? 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  {/* Copy Card ID Button (feature-flagged) */}
                  {features.copyCopyCardId() && (
                    <button
                      onClick={handleCopyCardId}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-surface-elevated hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
                      aria-label="Copy card ID"
                      title={copyFeedback ? 'Copied!' : 'Copy card ID'}
                    >
                      <Copy className={`h-5 w-5 transition-colors ${copyFeedback ? 'text-green-400' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-surface-elevated hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Content - single scrollable column on mobile, two-column on desktop */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
              {/* Image column - full width on mobile, fixed left panel on desktop */}
              <div className="flex-shrink-0 bg-gradient-to-br from-slate-900 to-cobalt-950 p-4 md:w-80 md:border-r md:border-border md:overflow-y-auto">
                <div className="relative mx-auto aspect-[5/7] w-full max-w-[160px] overflow-hidden rounded-lg border-2 border-cobalt-500/40 md:max-w-none shadow-lg hover:shadow-xl hover:border-cobalt-500/60 transition-all duration-300">
                  <CardArtImage
                    card={card}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(max-width: 768px) 160px, 320px"
                    priority
                  />
                </div>
              </div>

              {/* Details column - with mobile tabs */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Tab Navigation (hidden on desktop) */}
                <div className="md:hidden flex-shrink-0 flex border-b border-cobalt-500/30 bg-surface-muted/50">
                  {['stats', 'details', 'rules'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as typeof activeTab)}
                      className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === tab
                          ? 'border-cobalt-400 text-cobalt-300 bg-cobalt-500/10'
                          : 'border-transparent text-steel-500 hover:text-steel-400'
                      }`}
                    >
                      {tab === 'stats' ? 'Stats' : tab === 'details' ? 'Info' : 'Rules'}
                    </button>
                  ))}
                </div>

                {/* Scrollable Details Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Desktop: Show all content */}
                  <div className="hidden md:block space-y-5 bg-gradient-to-b from-cobalt-950/20 to-surface p-4 md:p-6">
                    {/* Type - Compact */}
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Type</p>
                      <p className="text-sm font-medium text-foreground">{card.type}</p>
                    </div>

                    {/* Price History (feature-flagged) */}
                    {features.priceHistory() && card.price && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Market Value</p>
                        <div className="rounded-lg border border-cobalt-500/30 bg-cobalt-500/10 p-4 space-y-2 hover:bg-cobalt-500/15 transition-colors">
                          {card.price.market && (
                            <div className="flex justify-between text-xs">
                              <span className="text-steel-500">Market:</span>
                              <span className="font-semibold text-cobalt-300">${(card.price.market / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {card.price.low && (
                            <div className="flex justify-between text-xs">
                              <span className="text-steel-500">Low:</span>
                              <span className="font-mono text-steel-400">${(card.price.low / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {card.price.mid && (
                            <div className="flex justify-between text-xs">
                              <span className="text-steel-500">Mid:</span>
                              <span className="font-mono text-steel-400">${(card.price.mid / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {card.price.high && (
                            <div className="flex justify-between text-xs">
                              <span className="text-steel-500">High:</span>
                              <span className="font-mono text-steel-400">${(card.price.high / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {card.price.foil && (
                            <div className="flex justify-between text-xs">
                              <span className="text-steel-500">Foil:</span>
                              <span className="font-mono text-amber-300 font-semibold">${(card.price.foil / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {!card.price.market && !card.price.low && !card.price.mid && !card.price.high && !card.price.foil && (
                            <p className="text-xs text-steel-600">No price data available</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Combat Stats - Redesigned with color coding and icons */}
                    {(card.ap !== undefined || card.hp !== undefined || card.level !== undefined) && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel-600">Combat Stats</p>
                        <div className="grid grid-cols-3 gap-3">
                          {card.level !== undefined && (
                            <div className="group relative rounded-lg border-2 border-steel-500/40 bg-gradient-to-br from-steel-700/20 to-steel-800/10 px-3 py-3 text-center hover:border-steel-400/80 hover:bg-steel-700/30 transition-all duration-200 cursor-default">
                              <Star className="h-4 w-4 mx-auto mb-1 text-steel-500 group-hover:text-steel-300 transition-colors" />
                              <p className="text-[9px] uppercase tracking-wider text-steel-600 group-hover:text-steel-400 font-bold">Lvl</p>
                              <p className="text-xl font-bold tabular-nums text-steel-200 group-hover:text-steel-100 transition-colors">{card.level}</p>
                            </div>
                          )}
                          {card.ap !== undefined && (
                            <div className="group relative rounded-lg border-2 border-amber-500/40 bg-gradient-to-br from-amber-700/20 to-amber-800/10 px-3 py-3 text-center hover:border-amber-400/80 hover:bg-amber-700/30 transition-all duration-200 cursor-default">
                              <Zap className="h-4 w-4 mx-auto mb-1 text-amber-500 group-hover:text-amber-300 transition-colors" />
                              <p className="text-[9px] uppercase tracking-wider text-amber-600 group-hover:text-amber-400 font-bold">AP</p>
                              <p className="text-xl font-bold tabular-nums text-amber-200 group-hover:text-amber-100 transition-colors">{card.ap}</p>
                            </div>
                          )}
                          {card.hp !== undefined && (
                            <div className="group relative rounded-lg border-2 border-red-500/40 bg-gradient-to-br from-red-700/20 to-red-800/10 px-3 py-3 text-center hover:border-red-400/80 hover:bg-red-700/30 transition-all duration-200 cursor-default">
                              <Heart className="h-4 w-4 mx-auto mb-1 text-red-500 group-hover:text-red-300 transition-colors" />
                              <p className="text-[9px] uppercase tracking-wider text-red-600 group-hover:text-red-400 font-bold">HP</p>
                              <p className="text-xl font-bold tabular-nums text-red-200 group-hover:text-red-100 transition-colors">{card.hp}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pilot Modifiers */}
                    {(card.apModifier !== undefined || card.hpModifier !== undefined) && (
                      <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Modifiers</p>
                        <div className="grid grid-cols-2 gap-3">
                          {card.apModifier !== undefined && (
                            <div className="rounded-lg border-2 border-cobalt-400/50 bg-cobalt-500/15 px-3 py-2.5 text-center hover:bg-cobalt-500/25 hover:border-cobalt-400/80 transition-all duration-200 group cursor-default">
                              <p className="text-[9px] uppercase tracking-wider text-cobalt-600 group-hover:text-cobalt-400 font-bold transition-colors">AP Mod</p>
                              <p className="text-lg font-bold tabular-nums text-cobalt-300 group-hover:text-cobalt-200 transition-colors">
                                {card.apModifier > 0 ? '+' : ''}
                                {card.apModifier}
                              </p>
                            </div>
                          )}
                          {card.hpModifier !== undefined && (
                            <div className="rounded-lg border-2 border-red-400/50 bg-red-500/15 px-3 py-2.5 text-center hover:bg-red-500/25 hover:border-red-400/80 transition-all duration-200 group cursor-default">
                              <p className="text-[9px] uppercase tracking-wider text-red-600 group-hover:text-red-400 font-bold transition-colors">HP Mod</p>
                              <p className="text-lg font-bold tabular-nums text-red-300 group-hover:text-red-200 transition-colors">
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
                        <p className="text-sm text-steel-300">{card.traits.join(' • ')}</p>
                      </div>
                    )}

                    {/* Link Condition */}
                    {card.linkCondition && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Link Condition</p>
                        <p className="text-sm text-steel-300">{card.linkCondition}</p>
                      </div>
                    )}

                    {/* Keywords - Enhanced styling */}
                    {card.keywords && card.keywords.length > 0 && (
                      <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {card.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="group relative rounded-full bg-cobalt-600 px-3 py-1.5 text-xs font-semibold text-cobalt-50 border border-cobalt-500/60 hover:bg-cobalt-500 hover:border-cobalt-400 transition-all duration-200 cursor-default hover:shadow-lg hover:shadow-cobalt-500/30 transform hover:scale-105"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Triggers - Enhanced styling */}
                    {card.triggers && card.triggers.length > 0 && (
                      <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Triggers</p>
                        <div className="flex flex-wrap gap-2">
                          {card.triggers.map((tr) => (
                            <span
                              key={tr}
                              className="group relative rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-amber-50 border border-amber-500/60 hover:bg-amber-500 hover:border-amber-400 transition-all duration-200 cursor-default hover:shadow-lg hover:shadow-amber-500/30 transform hover:scale-105"
                            >
                              <Zap className="inline h-3 w-3 mr-1" />
                              {tr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clans/Factions - Enhanced styling */}
                    {card.clans && card.clans.length > 0 && (
                      <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Factions</p>
                        <div className="flex flex-wrap gap-2">
                          {card.clans.map((clan) => (
                            <span
                              key={clan}
                              className="group relative rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-50 border border-emerald-500/60 hover:bg-emerald-500 hover:border-emerald-400 transition-all duration-200 cursor-default hover:shadow-lg hover:shadow-emerald-500/30 transform hover:scale-105"
                            >
                              {clan}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rules Text - Premium styling */}
                    <div>
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Rules Text</p>
                      <div className="rounded-lg border-2 border-cobalt-500/30 bg-cobalt-950/40 p-4 hover:bg-cobalt-950/50 hover:border-cobalt-500/50 transition-all duration-200 group">
                        <p className="whitespace-pre-wrap text-sm text-steel-300 group-hover:text-steel-200 transition-colors">
                          {card.text?.trim() ? card.text : 'No rules text available for this card.'}
                        </p>
                      </div>
                    </div>

                    {/* Playtest Actions (feature-flagged) */}
                    {features.playtestActions() && (
                      <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Playtest Actions</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-50 border border-emerald-500/60 hover:bg-emerald-500 transition-all duration-200 transform hover:scale-105">Play</span>
                          {card.type?.includes('Pilot') && (
                            <span className="rounded-full bg-cobalt-600 px-3 py-1.5 text-xs font-semibold text-cobalt-50 border border-cobalt-500/60 hover:bg-cobalt-500 transition-all duration-200 transform hover:scale-105">Link</span>
                          )}
                          {card.ap !== undefined && (
                            <span className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-orange-50 border border-orange-500/60 hover:bg-orange-500 transition-all duration-200 transform hover:scale-105">Attack</span>
                          )}
                          <span className="rounded-full bg-steel-600 px-3 py-1.5 text-xs font-semibold text-steel-50 border border-steel-500/60 hover:bg-steel-500 transition-all duration-200 transform hover:scale-105">Resource</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile: Tab Content */}
                  <div className="md:hidden space-y-4 bg-gradient-to-b from-cobalt-950/20 to-surface p-4">
                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                      <>
                        {(card.ap !== undefined || card.hp !== undefined || card.level !== undefined) && (
                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel-600">Combat Stats</p>
                            <div className="grid grid-cols-3 gap-3">
                              {card.level !== undefined && (
                                <div className="group relative rounded-lg border-2 border-steel-500/40 bg-gradient-to-br from-steel-700/20 to-steel-800/10 px-3 py-4 text-center hover:border-steel-400/80 hover:bg-steel-700/30 transition-all duration-200 cursor-default">
                                  <Star className="h-5 w-5 mx-auto mb-2 text-steel-500 group-hover:text-steel-300 transition-colors" />
                                  <p className="text-[9px] uppercase tracking-wider text-steel-600 group-hover:text-steel-400 font-bold">Level</p>
                                  <p className="text-2xl font-bold tabular-nums text-steel-200 group-hover:text-steel-100 transition-colors">{card.level}</p>
                                </div>
                              )}
                              {card.ap !== undefined && (
                                <div className="group relative rounded-lg border-2 border-amber-500/40 bg-gradient-to-br from-amber-700/20 to-amber-800/10 px-3 py-4 text-center hover:border-amber-400/80 hover:bg-amber-700/30 transition-all duration-200 cursor-default">
                                  <Zap className="h-5 w-5 mx-auto mb-2 text-amber-500 group-hover:text-amber-300 transition-colors" />
                                  <p className="text-[9px] uppercase tracking-wider text-amber-600 group-hover:text-amber-400 font-bold">Attack</p>
                                  <p className="text-2xl font-bold tabular-nums text-amber-200 group-hover:text-amber-100 transition-colors">{card.ap}</p>
                                </div>
                              )}
                              {card.hp !== undefined && (
                                <div className="group relative rounded-lg border-2 border-red-500/40 bg-gradient-to-br from-red-700/20 to-red-800/10 px-3 py-4 text-center hover:border-red-400/80 hover:bg-red-700/30 transition-all duration-200 cursor-default">
                                  <Heart className="h-5 w-5 mx-auto mb-2 text-red-500 group-hover:text-red-300 transition-colors" />
                                  <p className="text-[9px] uppercase tracking-wider text-red-600 group-hover:text-red-400 font-bold">Health</p>
                                  <p className="text-2xl font-bold tabular-nums text-red-200 group-hover:text-red-100 transition-colors">{card.hp}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {(card.apModifier !== undefined || card.hpModifier !== undefined) && (
                          <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Modifiers</p>
                            <div className="grid grid-cols-2 gap-3">
                              {card.apModifier !== undefined && (
                                <div className="rounded-lg border-2 border-cobalt-400/50 bg-cobalt-500/15 px-3 py-2.5 text-center hover:bg-cobalt-500/25 hover:border-cobalt-400/80 transition-all duration-200 group cursor-default">
                                  <p className="text-[9px] uppercase tracking-wider text-cobalt-600 group-hover:text-cobalt-400 font-bold transition-colors">AP Mod</p>
                                  <p className="text-lg font-bold tabular-nums text-cobalt-300 group-hover:text-cobalt-200 transition-colors">
                                    {card.apModifier > 0 ? '+' : ''}
                                    {card.apModifier}
                                  </p>
                                </div>
                              )}
                              {card.hpModifier !== undefined && (
                                <div className="rounded-lg border-2 border-red-400/50 bg-red-500/15 px-3 py-2.5 text-center hover:bg-red-500/25 hover:border-red-400/80 transition-all duration-200 group cursor-default">
                                  <p className="text-[9px] uppercase tracking-wider text-red-600 group-hover:text-red-400 font-bold transition-colors">HP Mod</p>
                                  <p className="text-lg font-bold tabular-nums text-red-300 group-hover:text-red-200 transition-colors">
                                    {card.hpModifier > 0 ? '+' : ''}
                                    {card.hpModifier}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                      <>
                        <div>
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Type</p>
                          <p className="text-sm font-medium text-foreground">{card.type}</p>
                        </div>

                        {card.traits && card.traits.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Traits</p>
                            <p className="text-sm text-steel-300">{card.traits.join(' • ')}</p>
                          </div>
                        )}

                        {card.linkCondition && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Link Condition</p>
                            <p className="text-sm text-steel-300">{card.linkCondition}</p>
                          </div>
                        )}

                        {card.keywords && card.keywords.length > 0 && (
                          <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Keywords</p>
                            <div className="flex flex-wrap gap-2">
                              {card.keywords.map((kw) => (
                                <span
                                  key={kw}
                                  className="group relative rounded-full bg-cobalt-600 px-3 py-1.5 text-xs font-semibold text-cobalt-50 border border-cobalt-500/60 hover:bg-cobalt-500 hover:border-cobalt-400 transition-all duration-200 cursor-default hover:shadow-lg hover:shadow-cobalt-500/30 transform hover:scale-105"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {card.triggers && card.triggers.length > 0 && (
                          <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Triggers</p>
                            <div className="flex flex-wrap gap-2">
                              {card.triggers.map((tr) => (
                                <span
                                  key={tr}
                                  className="group relative rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-amber-50 border border-amber-500/60 hover:bg-amber-500 hover:border-amber-400 transition-all duration-200 cursor-default hover:shadow-lg hover:shadow-amber-500/30 transform hover:scale-105"
                                >
                                  <Zap className="inline h-3 w-3 mr-1" />
                                  {tr}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {card.clans && card.clans.length > 0 && (
                          <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Factions</p>
                            <div className="flex flex-wrap gap-2">
                              {card.clans.map((clan) => (
                                <span
                                  key={clan}
                                  className="group relative rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-50 border border-emerald-500/60 hover:bg-emerald-500 hover:border-emerald-400 transition-all duration-200 cursor-default hover:shadow-lg hover:shadow-emerald-500/30 transform hover:scale-105"
                                >
                                  {clan}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {features.priceHistory() && card.price && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel-600">Market Value</p>
                            <div className="rounded-lg border border-cobalt-500/30 bg-cobalt-500/10 p-4 space-y-2 hover:bg-cobalt-500/15 transition-colors">
                              {card.price.market && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-steel-500">Market:</span>
                                  <span className="font-semibold text-cobalt-300">${(card.price.market / 100).toFixed(2)}</span>
                                </div>
                              )}
                              {card.price.low && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-steel-500">Low:</span>
                                  <span className="font-mono text-steel-400">${(card.price.low / 100).toFixed(2)}</span>
                                </div>
                              )}
                              {card.price.mid && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-steel-500">Mid:</span>
                                  <span className="font-mono text-steel-400">${(card.price.mid / 100).toFixed(2)}</span>
                                </div>
                              )}
                              {card.price.high && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-steel-500">High:</span>
                                  <span className="font-mono text-steel-400">${(card.price.high / 100).toFixed(2)}</span>
                                </div>
                              )}
                              {card.price.foil && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-steel-500">Foil:</span>
                                  <span className="font-mono text-amber-300 font-semibold">${(card.price.foil / 100).toFixed(2)}</span>
                                </div>
                              )}
                              {!card.price.market && !card.price.low && !card.price.mid && !card.price.high && !card.price.foil && (
                                <p className="text-xs text-steel-600">No price data available</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Rules Tab */}
                    {activeTab === 'rules' && (
                      <>
                        <div>
                          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Rules Text</p>
                          <div className="rounded-lg border-2 border-cobalt-500/30 bg-cobalt-950/40 p-4 hover:bg-cobalt-950/50 hover:border-cobalt-500/50 transition-all duration-200 group">
                            <p className="whitespace-pre-wrap text-sm text-steel-300 group-hover:text-steel-200 transition-colors">
                              {card.text?.trim() ? card.text : 'No rules text available for this card.'}
                            </p>
                          </div>
                        </div>

                        {features.playtestActions() && (
                          <div>
                            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-steel-600">Playtest Actions</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-50 border border-emerald-500/60 hover:bg-emerald-500 transition-all duration-200 transform hover:scale-105">Play</span>
                              {card.type?.includes('Pilot') && (
                                <span className="rounded-full bg-cobalt-600 px-3 py-1.5 text-xs font-semibold text-cobalt-50 border border-cobalt-500/60 hover:bg-cobalt-500 transition-all duration-200 transform hover:scale-105">Link</span>
                              )}
                              {card.ap !== undefined && (
                                <span className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-orange-50 border border-orange-500/60 hover:bg-orange-500 transition-all duration-200 transform hover:scale-105">Attack</span>
                              )}
                              <span className="rounded-full bg-steel-600 px-3 py-1.5 text-xs font-semibold text-steel-50 border border-steel-500/60 hover:bg-steel-500 transition-all duration-200 transform hover:scale-105">Resource</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Redesigned with better spacing and emphasis */}
            <div className="flex flex-shrink-0 flex-col gap-3 border-t border-cobalt-500/30 bg-gradient-to-r from-surface-muted to-surface px-4 py-3 md:px-6 md:py-4">
              {/* Compare Cards Button (feature-flagged) */}
              {features.compareCards() && (
                <Button variant="secondary" className="w-full hover:shadow-md transition-shadow">
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
                    className="hover:shadow-md transition-all"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    disabled={!canGoNext}
                    onClick={() => canGoNext && onSelectCard && onSelectCard(allCards[currentIndex + 1].id)}
                    size="sm"
                    variant="secondary"
                    className="hover:shadow-md transition-all"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Add/Remove controls (deck builder context only) */}
              {context === 'deckbuilder' && (
                <div className="flex flex-col gap-3">
                  {/* Quantity Control */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-lg border-2 border-cobalt-500/40 bg-cobalt-500/10 px-3 py-2 group hover:border-cobalt-400/60 hover:bg-cobalt-500/20 transition-all">
                      <button
                        onClick={onRemove}
                        disabled={qty === 0}
                        className="inline-flex h-8 w-8 items-center justify-center text-foreground hover:bg-cobalt-600/50 disabled:opacity-40 rounded transition-colors"
                        aria-label={`Remove ${card.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        value={qty}
                        readOnly
                        className="w-8 bg-transparent text-center text-sm font-bold text-cobalt-300"
                        aria-label={`Quantity of ${card.name}`}
                      />
                      <button
                        onClick={onAdd}
                        className="inline-flex h-8 w-8 items-center justify-center text-foreground hover:bg-cobalt-600/50 rounded transition-colors"
                        aria-label={`Add ${card.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Button onClick={onAdd} className="flex-1 bg-gradient-to-r from-cobalt-500 to-cobalt-600 hover:from-cobalt-400 hover:to-cobalt-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                    Add to Deck
                  </Button>

                  <Button onClick={() => onOpenChange(false)} variant="secondary" className="w-full hover:shadow-md transition-all">
                    Close
                  </Button>
                </div>
              )}

              {/* Cards page context */}
              {context === 'cards' && (
                <Button onClick={() => onOpenChange(false)} variant="secondary" className="w-full hover:shadow-md transition-all">
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
