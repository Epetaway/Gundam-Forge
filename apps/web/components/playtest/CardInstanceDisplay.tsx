'use client';

import { CardInstance } from '@/lib/game/game-engine';
import { cardsById } from '@/lib/data/cards';

interface CardInstanceDisplayProps {
  cardInstance: CardInstance;
  onToggleRest?: (instanceId: string) => void;
  onSelect?: (instanceId: string) => void;
  selected?: boolean;
}

export default function CardInstanceDisplay({
  cardInstance,
  onToggleRest,
  onSelect,
  selected,
}: CardInstanceDisplayProps) {
  const card = cardsById.get(cardInstance.cardId);

  if (!card) return null;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggleRest?.(cardInstance.instanceId);
  };

  return (
    <div
      onClick={() => onSelect?.(cardInstance.instanceId)}
      onContextMenu={handleContextMenu}
      className={`relative w-24 h-32 rounded border-2 transition cursor-pointer transform
        ${selected ? 'ring-2 ring-yellow-400' : ''}
        ${cardInstance.state === 'rest' ? 'rotate-90 opacity-75' : ''}
        ${card.imageUrl ? 'border-slate-600' : 'border-slate-700'}
        hover:border-slate-500 hover:scale-105`}
    >
      {/* Card Image */}
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover rounded"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 rounded flex flex-col items-center justify-center p-2">
          <p className="text-xs font-bold text-center text-white truncate">{card.name}</p>
          <p className="text-xs text-slate-300 mt-1">{card.cost} AP</p>
        </div>
      )}

      {/* Damage Markers */}
      {cardInstance.damageMarkers > 0 && (
        <div className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold">
          {cardInstance.damageMarkers}
        </div>
      )}

      {/* Rest Indicator */}
      {cardInstance.state === 'rest' && (
        <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold">
          RESTED
        </div>
      )}

      {/* HP if applicable */}
      {card.hp && (
        <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
          {Math.max(0, card.hp - cardInstance.damageMarkers)}/{card.hp}
        </div>
      )}

      {/* Hover: Right-click to rest/unrest */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/50 rounded flex items-center justify-center transition text-xs text-white font-semibold pointer-events-none">
        Right-click to {cardInstance.state === 'ready' ? 'Rest' : 'Ready'}
      </div>
    </div>
  );
}
