'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CardArtImage } from '@/components/ui/CardArtImage';
import type { DeckViewItem } from '@/lib/deck/sortFilter';

interface CardViewerModalProps {
  items: DeckViewItem[];
  activeCardId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectCard: (cardId: string) => void;
}

export function CardViewerModal({
  items,
  activeCardId,
  onOpenChange,
  onSelectCard,
}: CardViewerModalProps): JSX.Element {
  const open = activeCardId !== null;
  const currentIndex = React.useMemo(
    () => items.findIndex((item) => item.id === activeCardId),
    [activeCardId, items],
  );
  const currentCard = currentIndex >= 0 ? items[currentIndex] : null;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const goPrev = React.useCallback(() => {
    if (!canGoPrev) return;
    onSelectCard(items[currentIndex - 1].id);
  }, [canGoPrev, currentIndex, items, onSelectCard]);

  const goNext = React.useCallback(() => {
    if (!canGoNext) return;
    onSelectCard(items[currentIndex + 1].id);
  }, [canGoNext, currentIndex, items, onSelectCard]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl" onKeyDown={onKeyDown}>
        {currentCard ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{currentCard.name}</DialogTitle>
              <DialogDescription>
                {currentCard.id} · {currentCard.typeLine} · Cost {currentCard.cmc} · Qty x{currentCard.qty}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
              <div className="mx-auto w-full max-w-[320px]">
                <div className="relative aspect-[5/7] overflow-hidden rounded-md border border-border bg-black">
                  <CardArtImage
                    card={currentCard}
                    className="h-full w-full object-cover"
                    fill
                    sizes="320px"
                  />
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto rounded-md border border-border bg-surface-muted/70 p-4">
                {/* Type */}
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-steel-600">Type</p>
                  <p className="text-sm font-semibold text-foreground">{currentCard.typeLine}</p>
                </div>

                {/* Combat stats — AP / HP / Level */}
                {(currentCard.ap !== undefined || currentCard.hp !== undefined || currentCard.level !== undefined) ? (
                  <div className="grid grid-cols-3 gap-2">
                    {currentCard.level !== undefined ? (
                      <div className="rounded-md border border-border bg-surface px-2 py-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-steel-600">Level</p>
                        <p className="text-xl font-bold tabular-nums text-foreground">{currentCard.level}</p>
                      </div>
                    ) : null}
                    {currentCard.ap !== undefined ? (
                      <div className="rounded-md border border-border bg-surface px-2 py-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-steel-600">AP</p>
                        <p className="text-xl font-bold tabular-nums text-foreground">{currentCard.ap}</p>
                      </div>
                    ) : null}
                    {currentCard.hp !== undefined ? (
                      <div className="rounded-md border border-border bg-surface px-2 py-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-steel-600">HP</p>
                        <p className="text-xl font-bold tabular-nums text-foreground">{currentCard.hp}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Pilot modifiers — shown only for Pilot cards */}
                {(currentCard.apModifier !== undefined || currentCard.hpModifier !== undefined) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {currentCard.apModifier !== undefined ? (
                      <div className="rounded-md border border-cobalt-400/30 bg-cobalt-500/10 px-2 py-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-steel-600">AP Mod</p>
                        <p className="text-lg font-bold tabular-nums text-cobalt-300">
                          {currentCard.apModifier > 0 ? '+' : ''}{currentCard.apModifier}
                        </p>
                      </div>
                    ) : null}
                    {currentCard.hpModifier !== undefined ? (
                      <div className="rounded-md border border-cobalt-400/30 bg-cobalt-500/10 px-2 py-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-steel-600">HP Mod</p>
                        <p className="text-lg font-bold tabular-nums text-cobalt-300">
                          {currentCard.hpModifier > 0 ? '+' : ''}{currentCard.hpModifier}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Traits */}
                {currentCard.traits?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-steel-600">Traits</p>
                    <p className="text-sm text-foreground">{currentCard.traits.join(' · ')}</p>
                  </div>
                ) : null}

                {/* Link Condition (Units) */}
                {currentCard.linkCondition ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-steel-600">Link Condition</p>
                    <p className="text-sm text-foreground">{currentCard.linkCondition}</p>
                  </div>
                ) : null}

                {/* Rules text */}
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-steel-600">Rules</p>
                  <p className="whitespace-pre-wrap text-sm text-steel-700">
                    {currentCard.text?.trim() ? currentCard.text : 'No rules text available.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button disabled={!canGoPrev} onClick={goPrev} size="sm" type="button" variant="secondary">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button disabled={!canGoNext} onClick={goNext} size="sm" type="button" variant="secondary">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-steel-600">No card selected.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
