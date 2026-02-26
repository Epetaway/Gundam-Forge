'use client';

import { ArrowRight, ChevronDown, ChevronLeft, CircleHelp, Minus, Plus, Star, X } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { CardArtImage } from '@/components/ui/CardArtImage';

type CardRef = Pick<CardDefinition, 'id' | 'name' | 'type' | 'color' | 'cost' | 'set' | 'text' | 'imageUrl' | 'placeholderArt'>;

interface ReferenceCardDetailModalProps {
  card: CardRef | null;
  open: boolean;
  qty: number;
  onOpenChange: (open: boolean) => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

const tabs = ['Card options', 'In decks', 'Collection records', 'Card info', 'Rulings'] as const;

export function ReferenceCardDetailModal({
  card,
  open,
  qty,
  onOpenChange,
  onAdd,
  onRemove,
}: ReferenceCardDetailModalProps): JSX.Element {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(1240px,96vw)] max-w-[1240px] gap-0 border border-[#3a475c] bg-[#151a22] p-0">
        {card ? (
          <>
            <DialogHeader className="border-b border-[#2a3444] bg-[#1c2330] px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <DialogTitle className="text-4xl font-semibold leading-none text-[#e6edf8]">{card.name}</DialogTitle>
                  <DialogDescription className="text-sm text-[#9aa9bf]">
                    {card.id} • {card.color} • {card.type} • Cost {card.cost}
                  </DialogDescription>
                </div>
                <Button className="h-10 rounded-md border border-[#3a475c] bg-[#151a22] px-4 text-[#e6edf8]" variant="secondary">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Card links
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                {tabs.map((tab, index) => (
                  <button
                    className={`border-b-2 pb-1 text-sm font-semibold ${
                      index === 0 ? 'border-[#60a5fa] text-[#e6edf8]' : 'border-transparent text-[#9aa9bf]'
                    }`}
                    key={tab}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[8px] border border-[#3a475c] bg-black">
                  <div className="relative aspect-[5/7] w-full">
                    <CardArtImage card={card} className="h-full w-full object-cover" fill sizes="300px" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                  <div className="rounded-md border border-[#2a3444] bg-[#1c2330] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9aa9bf]">Quantity</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        className="h-11 w-28 rounded-md border border-[#2a3444] bg-[#151a22] px-3 text-lg font-semibold text-[#e6edf8]"
                        readOnly
                        value={qty}
                      />
                      <button
                        aria-label={`Decrease ${card.name}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#2a3444] bg-[#151a22] text-[#e6edf8] hover:bg-[#222b3a] disabled:opacity-40"
                        disabled={qty === 0}
                        onClick={onRemove}
                        type="button"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <button
                        aria-label={`Increase ${card.name}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#2a3444] bg-[#151a22] text-[#e6edf8] hover:bg-[#222b3a]"
                        onClick={onAdd}
                        type="button"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#9aa9bf]">Printing</p>
                    <button className="mt-1 flex h-11 w-full items-center justify-between rounded-md border border-[#2a3444] bg-[#151a22] px-3 text-sm font-medium text-[#e6edf8]" type="button">
                      {card.set} ({card.id})
                      <ChevronDown className="h-4 w-4 text-[#9aa9bf]" />
                    </button>
                  </div>

                  <div className="rounded-md border border-[#2a3444] bg-[#1c2330] p-3">
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button className="rounded-md border border-[#2a3444] bg-[#151a22] px-3 py-2 text-sm font-semibold text-[#e6edf8]" type="button">
                        All printings
                      </button>
                      <button className="rounded-md border border-[#2a3444] bg-[#151a22] px-3 py-2 text-sm font-semibold text-[#e6edf8]" type="button">
                        Nonfoil
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_230px]">
                  <div className="rounded-md border border-[#2a3444] bg-[#1c2330] p-3">
                    <div className="flex items-center gap-1 text-sm font-semibold text-[#e6edf8]">
                      Categories:
                      <CircleHelp className="h-4 w-4 text-[#9aa9bf]" />
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-[#2a3444] bg-[#151a22] p-2">
                      <Star className="h-4 w-4 text-[#60a5fa]" />
                      <span className="text-sm font-medium text-[#e6edf8]">Main Deck</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button className="rounded-md border border-[#2a3444] bg-[#151a22] px-2 py-2 text-sm font-semibold text-[#e6edf8]" type="button">Creature</button>
                      <button className="rounded-md border border-[#2a3444] bg-[#151a22] px-2 py-2 text-sm font-semibold text-[#e6edf8]" type="button">Sideboard</button>
                      <button className="rounded-md border border-[#2a3444] bg-[#151a22] px-2 py-2 text-sm font-semibold text-[#e6edf8]" type="button">Maybeboard</button>
                    </div>
                  </div>

                  <div className="rounded-md border border-[#2a3444] bg-[#1c2330] p-3">
                    <div className="space-y-2">
                      <button className="w-full rounded-md border border-[#2a3444] bg-[#151a22] px-3 py-2 text-left text-sm font-semibold text-[#e6edf8]" type="button">Default color tag</button>
                      <button className="w-full rounded-md border border-[#2a3444] bg-[#151a22] px-3 py-2 text-left text-sm font-semibold text-[#e6edf8]" type="button">Set Deck Image</button>
                      <button className="w-full rounded-md border border-[#2a3444] bg-[#151a22] px-3 py-2 text-left text-sm font-semibold text-[#e6edf8]" type="button">Add to collection</button>
                      <button className="w-full rounded-md border border-[#2a3444] bg-[#151a22] px-3 py-2 text-left text-sm font-semibold text-[#e6edf8]" type="button">Add to other deck</button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-[#2a3444] bg-[#151a22] p-3 text-sm text-[#d5ddeb]">
                  {card.text?.trim() ? card.text : 'No rules text available for this card.'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#2a3444] bg-[#1c2330] px-6 py-3">
              <Button className="h-10 rounded-md border border-[#2a3444] bg-[#151a22] text-[#e6edf8]" variant="secondary">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button className="h-10 rounded-md border border-[#2a3444] bg-[#151a22] text-[#e6edf8]" variant="secondary">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 text-sm text-[#9aa9bf]">No card selected.</div>
        )}

        <button
          aria-label="Close card details"
          className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#2a3444] bg-[#151a22] text-[#e6edf8] hover:bg-[#222b3a]"
          onClick={() => onOpenChange(false)}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
