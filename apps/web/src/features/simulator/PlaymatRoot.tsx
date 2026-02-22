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
      const imageSrc = def?.imageUrl || def?.placeholderArt;
      return (
        <div
          key={card.instanceId}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(DRAG_MIME, card.instanceId);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onDoubleClick={() => onToggleTapped(card.instanceId)}
          className="absolute h-20 w-14 cursor-grab rounded-lg border border-white/40 shadow-md overflow-hidden"
          style={{
            transform: `translate(${index * STACK_OFFSET}px, 0px) rotate(${card.tapped ? 90 : 0}deg)`,
            transformOrigin: 'center center',
            zIndex: index + 1
          }}
          title={def?.name ?? card.cardId}
        >
          {imageSrc ? (
            <img src={imageSrc} alt={def?.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col justify-between bg-gf-dark p-1">
              <p className="line-clamp-2 text-[8px] font-medium text-white leading-tight">{def?.name ?? card.cardId}</p>
              <p className="text-[7px] text-gray-400">{def?.id ?? card.cardId}</p>
            </div>
          )}
          <div className="absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gf-blue text-[7px] font-bold text-white">
            {def?.cost}
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
    <section className="rounded-xl overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gradient-to-br from-playmat-surface to-playmat-felt border border-white/10">
        {OFFICIAL_PLAYMAT_ZONE_TEMPLATE.map((zone) => {
          const zoneCards = zone.id === 'deck' ? deckPile : (zones[zone.id] ?? []);

          return (
            <div
              key={zone.id}
              className="absolute rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/10"
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
              <p className="pointer-events-none absolute left-1.5 top-1 text-[10px] font-medium uppercase tracking-wide text-white/50">
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
    </section>
  );
}
