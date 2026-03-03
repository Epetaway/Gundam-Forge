'use client';

import { CardInstance } from '@/lib/game/game-engine';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { Button } from '@/components/ui/Button';

interface OpeningHandModalProps {
  hand: CardInstance[];
  cardDatabase: Record<string, any>;
  onKeep: () => void;
  onMulligan: () => void;
  isOpen: boolean;
}

export default function OpeningHandModal({
  hand,
  cardDatabase,
  onKeep,
  onMulligan,
  isOpen,
}: OpeningHandModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="w-full max-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center py-8 border-b border-slate-700 bg-black/50">
          <h2 className="text-4xl font-bold text-white">Opening hand</h2>
        </div>

        {/* Card Display Area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-gradient-to-b from-slate-900 to-black relative overflow-visible">
          {/* Cards Grid */}
          <div className="grid grid-cols-7 gap-4">
            {hand.length > 0 ? (
              hand.map((card) => {
                const cardDef = cardDatabase[card.cardId];
                
                return (
                  <div
                    key={card.instanceId}
                    className="transform transition-all duration-200 hover:scale-110 hover:-translate-y-8 cursor-pointer group"
                  >
                    {/* Card */}
                    <div className="w-32 h-44 bg-gradient-to-b from-slate-600 to-slate-900 rounded-lg border-2 border-amber-600 shadow-xl overflow-hidden group-hover:shadow-2xl group-hover:border-amber-400 transition-all flex flex-col">
                      {/* Card Image */}
                      {cardDef ? (
                        <div className="w-full h-28 relative">
                          <CardArtImage
                            card={cardDef}
                            alt={cardDef.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-28 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-b border-slate-500">
                          <span className="text-xs text-white text-center px-2 font-bold">
                            {card.cardId}
                          </span>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="flex-1 bg-gradient-to-b from-slate-700 to-slate-900 p-2 flex flex-col justify-between border-t border-slate-600">
                        <div>
                          <div className="text-xs font-bold text-white truncate">
                            {cardDef?.name || 'Unknown Card'}
                          </div>
                          <div className="text-[10px] text-white">
                            {cardDef?.type || 'N/A'}
                          </div>
                        </div>

                        {/* Stats */}
                        {(cardDef?.cost || cardDef?.ap || cardDef?.hp) && (
                          <div className="flex gap-1 justify-center text-[9px] font-bold">
                            {cardDef?.cost && (
                              <div className="bg-amber-700 text-white px-1.5 py-0.5 rounded">
                                {cardDef.cost}
                              </div>
                            )}
                            {cardDef?.ap && (
                              <div className="bg-red-700 text-white px-1.5 py-0.5 rounded">
                                ATK {cardDef.ap}
                              </div>
                            )}
                            {cardDef?.hp && (
                              <div className="bg-blue-700 text-white px-1.5 py-0.5 rounded">
                                HP {cardDef.hp}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-7 text-center text-white py-12">
                <p>No cards in hand</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-700 bg-black/80 px-8 py-6 flex gap-4 justify-center">
          <Button
            onClick={onKeep}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded"
          >
            Keep this
          </Button>
          <Button
            onClick={onMulligan}
            variant="secondary"
            className="px-8 py-3 text-lg"
          >
            Mulligan ({hand.length})
          </Button>
          <Button variant="secondary" className="px-8 py-3 text-lg">
            Options
          </Button>
        </div>
      </div>
    </div>
  );
}
