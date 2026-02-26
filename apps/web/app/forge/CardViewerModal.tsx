import * as React from 'react';

export function CardViewerModal({
  cards,
  openId,
  onClose,
  onNavigate,
}: {
  cards: any[];
  openId: string | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const idx = openId ? cards.findIndex(c => c.id === openId) : -1;
  const card = idx >= 0 ? cards[idx] : null;
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!openId) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && idx > 0) onNavigate(cards[idx - 1].id);
      if (e.key === 'ArrowRight' && idx < cards.length - 1) onNavigate(cards[idx + 1].id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId, idx, cards, onClose, onNavigate]);
  if (!card) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" tabIndex={-1}>
      <div className="relative max-w-lg w-full bg-surface rounded shadow-xl p-6">
        <button className="absolute top-2 right-2 text-steel-600 hover:text-foreground" onClick={onClose}>&times;</button>
        {card.imageUrl && (
          <img src={card.imageUrl} alt={card.name} className="mx-auto mb-4 rounded max-h-80" />
        )}
        <h2 className="text-xl font-bold mb-1">{card.name}</h2>
        <div className="text-xs text-steel-600 mb-2">{[card.type, card.cost, card.setId].filter(Boolean).join(' • ')}</div>
        {card.text && <div className="whitespace-pre-wrap text-sm text-steel-700 mb-2">{card.text}</div>}
        <div className="flex justify-between mt-4">
          <button
            className="px-3 py-1 rounded bg-surface-interactive border border-border text-xs"
            disabled={idx <= 0}
            onClick={() => idx > 0 && onNavigate(cards[idx - 1].id)}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 rounded bg-surface-interactive border border-border text-xs"
            disabled={idx >= cards.length - 1}
            onClick={() => idx < cards.length - 1 && onNavigate(cards[idx + 1].id)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
