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
                <div className="p-6 md:p-8 space-y-6">
                  {/* Title Section */}
                  <div className="space-y-1">
                    <h2 className="font-display text-4xl font-bold text-foreground leading-tight">
                      {card.name}
                    </h2>
                    <p className="text-base text-steel-600 font-medium">
                      {card.type}
                      {card.color && ` — ${card.color}`}
                      {card.traits && card.traits.length > 0 && ` ${card.traits[0]}`}
                    </p>
                  </div>

                  {/* Ability/Rules Text */}
                  {card.text && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Rules Text</p>
                      <p className="text-base leading-relaxed text-steel-300 whitespace-pre-wrap font-medium">
                        {card.text}
                      </p>
                    </div>
                  )}

                  {/* Stats Block */}
                  {(card.ap !== undefined || card.hp !== undefined) && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Stats</p>
                      <div className="flex items-end justify-end gap-6">
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

                  {/* Traits */}
                  {card.traits && card.traits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Traits</p>
                      <p className="text-sm text-steel-300">{card.traits.join(' • ')}</p>
                    </div>
                  )}

                  {/* Source Information */}
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Source</p>
                    <p className="text-sm text-steel-500">
                      {card.set && `Set ${card.set} • `}
                      {card.id}
                    </p>
                  </div>

                  {/* Format Legalities Grid  */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-steel-500 uppercase tracking-wider">Format Legalities</p>
                    <div className="grid grid-cols-3 gap-3 gap-y-2 text-sm">
                      {[
                        'Standard',
                        'Modern',
                        'Pioneer',
                        'Commander',
                        'Legacy',
                        'Historic',
                      ].map((format) => (
                        <div key={format} className="flex items-start gap-1.5">
                          <span className="text-steel-400 flex-shrink-0">○</span>
                          <span className="text-steel-500">{format}</span>
                        </div>
                      ))}
                    </div>
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
