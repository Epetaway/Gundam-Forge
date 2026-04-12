'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/Dialog';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { useSwipeToClose } from '@/lib/hooks/useSwipeToClose';

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
  context?: 'deckbuilder' | 'cards';
  qty?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  allCards?: CardDetailModalCard[];
  onSelectCard?: (cardId: string) => void;
}

/**
 * Premium Editorial-Style Card Detail Modal
 * Large hero image on left (60%), text-rich details on right (40%)
 * Inspired by high-end TCG resources like TCGPlayer
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
  const contentRef = useRef<HTMLDivElement>(null);

  useSwipeToClose(contentRef, {
    threshold: 50,
    onClose: () => onOpenChange(false),
  });

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!card) return <></>;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={contentRef}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface focus:outline-none data-[state=closed]:animate-zoom-out data-[state=open]:animate-zoom-in sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88svh] sm:w-[min(1200px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:border-steel-600/30 sm:shadow-2xl lg:w-[min(1200px,90vw)]"
        >
          {/* Close Button - Fixed Top Right with Jewel Tone */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute z-20 top-4 right-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded flex items-center gap-1.5 transition-all duration-200 hover:shadow-lg"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
            Close
          </button>

          {/* Main Content - 2 Column Editorial Layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column - Hero Image (60% on desktop) */}
            <div className="hidden sm:flex w-3/5 bg-gradient-to-br from-slate-900 to-slate-950 p-6 items-center justify-center flex-shrink-0 overflow-hidden">
              <div className="relative w-full max-w-sm aspect-[5/7] rounded-md border border-steel-600/40 overflow-hidden shadow-2xl hover:shadow-2xl transition-shadow">
                <CardArtImage
                  card={card}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(max-width: 1200px) 50vw, 600px"
                  priority
                />
              </div>
            </div>

            {/* Right Column - Details (40% on desktop, full on mobile) */}
            <div className="w-full sm:w-2/5 flex flex-col overflow-hidden">
              {/* Card Image on Mobile */}
              <div className="sm:hidden w-full bg-gradient-to-br from-slate-900 to-slate-950 p-4 flex-shrink-0">
                <div className="relative w-full max-w-xs aspect-[5/7] mx-auto rounded-md border border-steel-600/40 overflow-hidden shadow-lg">
                  <CardArtImage
                    card={card}
                    className="h-full w-full object-cover"
                    fill
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>

              {/* Scrollable Details Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-8 space-y-5">
                  {/* Title Section with Cost */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="font-display text-4xl font-bold text-foreground leading-tight">
                          {card.name}
                        </h2>
                        <p className="text-base text-steel-600 font-medium mt-1">
                          {card.type}
                          {card.color && ` — ${card.color}`}
                          {card.traits && card.traits.length > 0 && ` (${card.traits.join(') (')})`}
                        </p>
                      </div>
                      {/* Cost Badge */}
                      {card.cost !== undefined && (
                        <div className="flex flex-col items-center gap-1 px-3 py-2 bg-amber-500/20 border border-amber-500/40 rounded">
                          <span className="text-xs text-amber-600 font-bold">COST</span>
                          <span className="text-2xl font-bold text-amber-300">{card.cost}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Level Display */}
                  {card.level !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-steel-700/30 border border-steel-500/30 rounded w-fit">
                      <span className="text-xs text-steel-500 font-bold">LEVEL</span>
                      <span className="text-xl font-bold text-steel-300">{card.level}</span>
                    </div>
                  )}

                  {/* Full Rules Text - Prominent */}
                  {card.text && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Rules Text</p>
                      <div className="bg-surface-muted/50 border border-steel-600/30 rounded p-4">
                        <p className="text-sm leading-relaxed text-steel-200 whitespace-pre-wrap">
                          {card.text}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stats Block */}
                  {(card.ap !== undefined || card.hp !== undefined) && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Stats</p>
                      <div className="flex items-end justify-end gap-8">
                        {card.ap !== undefined && (
                          <div className="text-right">
                            <p className="text-xs text-steel-500 font-medium">Attack</p>
                            <p className="text-3xl font-bold text-amber-400">{card.ap}</p>
                          </div>
                        )}
                        {card.hp !== undefined && (
                          <div className="text-right">
                            <p className="text-xs text-steel-500 font-medium">Health</p>
                            <p className="text-3xl font-bold text-red-400">{card.hp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AP/HP Modifiers */}
                  {(card.apModifier !== undefined || card.hpModifier !== undefined) && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Modifiers</p>
                      <div className="flex gap-3">
                        {card.apModifier !== undefined && (
                          <div className="px-3 py-2 bg-cobalt-500/20 border border-cobalt-500/40 rounded">
                            <p className="text-xs text-cobalt-600 font-bold">AP Mod</p>
                            <p className="text-lg font-bold text-cobalt-300">
                              {card.apModifier > 0 ? '+' : ''}{card.apModifier}
                            </p>
                          </div>
                        )}
                        {card.hpModifier !== undefined && (
                          <div className="px-3 py-2 bg-red-500/20 border border-red-500/40 rounded">
                            <p className="text-xs text-red-600 font-bold">HP Mod</p>
                            <p className="text-lg font-bold text-red-300">
                              {card.hpModifier > 0 ? '+' : ''}{card.hpModifier}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Keywords/Abilities */}
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {card.keywords.map((kw) => (
                          <span key={kw} className="px-2.5 py-1 bg-cobalt-500/30 border border-cobalt-500/50 rounded text-xs font-semibold text-cobalt-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Triggers */}
                  {card.triggers && card.triggers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Triggers</p>
                      <div className="flex flex-wrap gap-2">
                        {card.triggers.map((tr) => (
                          <span key={tr} className="px-2.5 py-1 bg-amber-500/30 border border-amber-500/50 rounded text-xs font-semibold text-amber-200">
                            {tr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clans/Factions */}
                  {card.clans && card.clans.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Clans</p>
                      <div className="flex flex-wrap gap-2">
                        {card.clans.map((clan) => (
                          <span key={clan} className="px-2.5 py-1 bg-emerald-500/30 border border-emerald-500/50 rounded text-xs font-semibold text-emerald-200">
                            {clan}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link Condition */}
                  {card.linkCondition && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Link Condition</p>
                      <p className="text-sm text-steel-300">{card.linkCondition}</p>
                    </div>
                  )}

                  {/* Source Information */}
                  <div className="space-y-2 pt-2 border-t border-steel-600/20">
                    <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Source</p>
                    <p className="text-sm text-steel-500">
                      {card.set && `Set ${card.set}`}
                      {card.set && card.id && ' • '}
                      {card.id}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-steel-600/20">
                    {context === 'deckbuilder' && (
                      <>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 border border-steel-600 rounded px-3 py-2 flex-shrink-0 bg-surface-muted/50">
                            <button
                              onClick={onRemove}
                              disabled={qty === 0}
                              className="inline-flex h-6 w-6 items-center justify-center text-foreground hover:text-indigo-400 disabled:opacity-40 transition-colors"
                              aria-label={`Remove ${card.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-semibold text-foreground w-6 text-center">{qty}</span>
                            <button
                              onClick={onAdd}
                              className="inline-flex h-6 w-6 items-center justify-center text-foreground hover:text-indigo-400 transition-colors"
                              aria-label={`Add ${card.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            onClick={onAdd}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition-all duration-200 hover:shadow-lg"
                          >
                            Add to Deck
                          </button>
                        </div>
                        <button className="w-full px-4 py-2 border border-steel-600 text-steel-300 hover:text-foreground hover:border-steel-500 rounded font-medium transition-colors duration-200">
                          ♡ Add to Wish List
                        </button>
                      </>
                    )}

                    {context === 'cards' && (
                      <button
                        onClick={() => onOpenChange(false)}
                        className="w-full px-4 py-2 border border-steel-600 text-steel-300 hover:text-foreground hover:border-steel-500 rounded font-medium transition-colors duration-200"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
