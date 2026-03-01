'use client';

import { CardInstance } from '@/lib/game/game-engine';
import { cardsById } from '@/lib/data/cards';

interface CardFanProps {
  hand: CardInstance[];
  onCardClick?: (card: CardInstance) => void;
}

export default function CardFan({ hand, onCardClick }: CardFanProps) {
  return (
    <div className="relative w-full h-48 mb-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-800 to-transparent rounded-t-3xl border-t border-l border-r border-slate-600"></div>

      {/* Cards in arc */}
      <div className="absolute inset-0 flex items-end justify-center pb-8">
        <div className="relative w-full max-w-6xl h-40">
          {hand.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <p>No cards in hand</p>
            </div>
          ) : (
            hand.map((card, idx) => {
              const totalCards = hand.length;
              const visibility = Math.max(0.6, 1 - Math.abs(idx - totalCards / 2) * 0.15);
              const anglePerCard = totalCards > 1 ? 100 / (totalCards - 1) : 0;
              const startAngle = -50;
              const angle = startAngle + idx * anglePerCard;
              const radians = (angle * Math.PI) / 180;
              const radius = 220;
              const x = Math.cos(radians) * radius;
              const y = Math.sin(radians) * radius + 100;
              const rotation = angle;

              const cardDef = cardsById.get(card.cardId);

              return (
                <div
                  key={card.instanceId}
                  className="absolute transform transition-all duration-200 hover:scale-125 hover:-translate-y-16 hover:z-50 cursor-pointer group"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `${y}px`,
                    transform: `translateX(-50%) rotateZ(${rotation}deg)`,
                    opacity: visibility,
                  }}
                  onClick={() => onCardClick?.(card)}
                >
                  {/* Card */}
                  <div className="w-28 bg-gradient-to-b from-slate-600 to-slate-800 rounded-lg border border-slate-500 shadow-lg overflow-hidden group-hover:shadow-2xl group-hover:border-amber-400 transition-all">
                    {/* Card Image Placeholder */}
                    <div className="w-28 h-36 bg-gradient-to-br from-slate-500 to-slate-700 flex flex-col items-center justify-center p-2 relative">
                      {/* Card Art Area */}
                      <div className="w-full h-20 bg-gradient-to-b from-slate-400 to-slate-600 rounded mb-1 flex items-center justify-center border border-slate-500">
                        {cardDef?.imageUrl ? (
                          <img
                            src={cardDef.imageUrl}
                            alt={cardDef.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="text-[8px] text-slate-300 text-center font-semibold px-1">
                            {cardDef?.name || card.cardId}
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="w-full text-center text-[10px]">
                        <div className="font-bold text-white truncate px-1">
                          {cardDef?.name?.slice(0, 12) || 'Card'}
                        </div>
                        <div className="text-slate-300 text-[8px]">
                          {cardDef?.type}
                        </div>

                        {/* Stats Row */}
                        <div className="flex gap-1 justify-center mt-1 text-[8px] font-bold">
                          {cardDef?.cost && (
                            <div className="bg-amber-600 text-white px-1 py-0.5 rounded text-[7px]">
                              ◇{cardDef.cost}
                            </div>
                          )}
                          {cardDef?.ap && (
                            <div className="bg-red-600 text-white px-1 py-0.5 rounded text-[7px]">
                              ⚔{cardDef.ap}
                            </div>
                          )}
                          {cardDef?.hp && (
                            <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[7px]">
                              ❤{cardDef.hp}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card State Indicator */}
                  {card.state === 'rest' && (
                    <div className="absolute inset-0 bg-red-500/20 rounded-lg border border-red-400"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hand Count */}
      <div className="absolute bottom-2 left-4 text-sm font-semibold text-slate-300">
        Cards in hand: {hand.length}
      </div>

      {/* Hand Options */}
      <div className="absolute bottom-2 right-4">
        <button className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1">
          Hand options ⋮
        </button>
      </div>
    </div>
  );
}
