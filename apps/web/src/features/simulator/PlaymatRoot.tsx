import type { DragEvent } from 'react';
import { OFFICIAL_PLAYMAT_ZONE_TEMPLATE } from '@gundam-forge/shared';
import type { CardDefinition } from '@gundam-forge/shared';
import type { SimCardInstance } from './simStore';

interface PlaymatRootProps {
  cardsById: Map<string, CardDefinition>;
  deckPile: SimCardInstance[];
  hand: SimCardInstance[];
  zones: Record<string, SimCardInstance[]>;
  onDropToHand: (instanceId: string) => void;
  onDropToZone: (instanceId: string, zoneId: string) => void;
  onToggleTapped: (instanceId: string) => void;
}

const STACK_OFFSET = 8;
const MAX_VISIBLE_STACK = 10;

const DRAG_MIME = 'application/x-gundam-forge-card';

const readDragCardId = (event: DragEvent<HTMLElement>) => {
  const payload = event.dataTransfer.getData(DRAG_MIME);
  if (!payload) return null;
  return payload;
};

const CardStack = ({
  cards,
  cardsById,
  onToggleTapped,
  className
}: {
  cards: SimCardInstance[];
  cardsById: Map<string, CardDefinition>;
  onToggleTapped: (instanceId: string) => void;
  className?: string;
}) => (
  <div className={className}>
    {cards.slice(Math.max(0, cards.length - MAX_VISIBLE_STACK)).map((card, index) => {
      const def = cardsById.get(card.cardId);
      return (
        <div
          key={card.instanceId}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(DRAG_MIME, card.instanceId);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onDoubleClick={() => onToggleTapped(card.instanceId)}
          className="absolute h-24 w-16 cursor-grab rounded border border-slate-700 bg-slate-900 p-1 text-[10px] shadow"
          style={{
            transform: `translate(${index * STACK_OFFSET}px, 0px) rotate(${card.tapped ? 90 : 0}deg)`,
            transformOrigin: 'center center',
            zIndex: index + 1
          }}
          title={def?.name ?? card.cardId}
        >
          <div className="flex h-full flex-col justify-between overflow-hidden rounded bg-slate-950 p-1">
            <p className="line-clamp-2 text-[10px] font-medium leading-tight">{def?.name ?? card.cardId}</p>
            <p className="text-[9px] text-slate-400">{def?.id ?? card.cardId}</p>
          </div>
        </div>
      );
    })}
  </div>
);

export function PlaymatRoot({
  cardsById,
  deckPile,
  hand,
  zones,
  onDropToHand,
  onDropToZone,
  onToggleTapped
}: PlaymatRootProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-lg font-semibold">Playmat</h2>

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-slate-700 bg-slate-950">
        {OFFICIAL_PLAYMAT_ZONE_TEMPLATE.map((zone) => {
          const zoneCards = zone.id === 'deck' ? deckPile : (zones[zone.id] ?? []);

          return (
            <div
              key={zone.id}
              className="absolute rounded border border-sky-700/60 bg-sky-900/10"
              style={{
                left: `${zone.xPercent}%`,
                top: `${zone.yPercent}%`,
                width: `${zone.widthPercent}%`,
                height: `${zone.heightPercent}%`
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                const instanceId = readDragCardId(event);
                if (!instanceId) return;
                onDropToZone(instanceId, zone.id);
              }}
            >
              <p className="pointer-events-none absolute left-1 top-1 text-[10px] uppercase tracking-wide text-sky-300">
                {zone.label}
              </p>
              <CardStack
                cards={zoneCards}
                cardsById={cardsById}
                onToggleTapped={onToggleTapped}
                className="relative h-full w-full p-2"
              />
            </div>
          );
        })}
      </div>

      <div
        className="mt-3 rounded border border-slate-700 bg-slate-950 p-3"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(event) => {
          event.preventDefault();
          const instanceId = readDragCardId(event);
          if (!instanceId) return;
          onDropToHand(instanceId);
        }}
      >
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Hand</p>
        <div className="relative min-h-28">
          <CardStack cards={hand} cardsById={cardsById} onToggleTapped={onToggleTapped} className="relative h-24" />
        </div>
      </div>
    </section>
  );
}
