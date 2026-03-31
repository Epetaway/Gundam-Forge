'use client';

import * as React from 'react';
import { groupDeckItemsByType } from '@/lib/deck/grouping';
import { CardStackTile } from '@/components/deck/CardStackTile';
import { CardHoverPreview } from '@/components/cards/CardHoverPreview';
import type { DeckViewRendererProps } from '@/components/deck/types';
import type { CardDefinition } from '@gundam-forge/shared';

export function StacksView({ items, selection, actions, ui }: DeckViewRendererProps): JSX.Element {
  const stacks = groupDeckItemsByType(items);
  const [hoveredCard, setHoveredCard] = React.useState<{ card: CardDefinition; anchor: DOMRect } | null>(null);

  if (stacks.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">
        No cards match your filters.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {stacks.map((stack) => (
          <section key={stack.id}>
            <header className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                {stack.label}
              </h3>
              <span className="rounded bg-surface-interactive px-2 py-0.5 text-xs font-semibold text-steel-500">
                {stack.totalQty}
              </span>
            </header>

            {/*
             * Responsive grid:
             *   mobile (default): 2 columns
             *   sm (640px+):      3 columns
             *   lg (1024px+):     4 columns
             *   xl (1280px+):     5 columns
             *
             * Items need right/bottom overflow for the stack depth layers,
             * so overflow-visible is important here.
             */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {stack.cards.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={(e) => {
                    setHoveredCard({ card: item as unknown as CardDefinition, anchor: e.currentTarget.getBoundingClientRect() });
                  }}
                  onMouseLeave={() => {
                    setHoveredCard(null);
                  }}
                >
                  <CardStackTile
                    item={item}
                    mode={ui.mode}
                    isActive={selection.activeCardId === item.id}
                    onOpen={() => actions.onOpenCard(item.id)}
                    onAdd={actions.onAdd ? () => actions.onAdd!(item.id) : undefined}
                    onRemove={actions.onRemove ? () => actions.onRemove!(item.id) : undefined}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Hover preview */}
      {hoveredCard && <CardHoverPreview card={hoveredCard.card} anchor={hoveredCard.anchor} />}
    </>
  );
}
