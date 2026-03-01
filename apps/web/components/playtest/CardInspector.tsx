'use client';

import { cardsById } from '@/lib/data/cards';

interface CardInspectorProps {
  cardId?: string;
}

export default function CardInspector({ cardId }: CardInspectorProps) {
  const card = cardId ? cardsById.get(cardId) : null;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 h-full overflow-y-auto">
      <h3 className="font-semibold mb-4 text-slate-300">Card Details</h3>

      {!card ? (
        <div className="text-slate-400 text-sm">Select a card to view details</div>
      ) : (
        <div className="space-y-4">
          {/* Card Image */}
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full rounded border border-slate-600"
            />
          )}

          {/* Card Name */}
          <div>
            <p className="text-xs text-slate-400">Name</p>
            <p className="font-semibold text-slate-200">{card.name}</p>
          </div>

          {/* Card Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-700 rounded p-2">
              <p className="text-xs text-slate-400">Cost</p>
              <p className="font-bold text-blue-400">{card.cost} AP</p>
            </div>
            {card.hp && (
              <div className="bg-slate-700 rounded p-2">
                <p className="text-xs text-slate-400">HP</p>
                <p className="font-bold text-red-400">{card.hp}</p>
              </div>
            )}
          </div>

          {/* Keywords */}
          {card.keywords && card.keywords.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Keywords</p>
              <div className="flex flex-wrap gap-1">
                {card.keywords.map((kw) => (
                  <span key={kw} className="bg-purple-900 text-purple-200 text-xs px-2 py-1 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Text/Description */}
          {card.text && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Text</p>
              <p className="text-xs text-slate-300 leading-relaxed">{card.text}</p>
            </div>
          )}

          {/* Rules Reference */}
          <div className="border-t border-slate-700 pt-4 mt-4">
            <p className="text-xs font-semibold text-slate-400 mb-2">Quick Rules</p>
            <div className="space-y-1 text-xs text-slate-400">
              <p>• Right-click cards in battle to <span className="text-yellow-400">Rest/Ready</span></p>
              <p>• Drag cards between zones</p>
              <p>• Click a unit to view details</p>
              <p>• Use action buttons to play</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
