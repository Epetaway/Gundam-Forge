import type { CardDefinition } from '@gundam-forge/shared';
import { useDeckStore } from './deckStore';

interface EnhancedCardPreviewProps {
  card: CardDefinition | undefined;
}

export function EnhancedCardPreview({ card }: EnhancedCardPreviewProps) {
  const deckEntries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);

  if (!card) {
    return (
      <aside className="rounded-lg border border-gcg-border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="mb-4 h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h2 className="font-heading text-xl font-bold text-gcg-text">Select a Card</h2>
          <p className="mt-2 text-sm text-gray-600">Browse the catalog and click any card to view details</p>
        </div>
      </aside>
    );
  }

  const qty = deckEntries.find((entry) => entry.cardId === card.id)?.qty ?? 0;

  const colorGradients: Record<string, string> = {
    White: 'from-blue-100 via-white to-gray-100',
    Blue: 'from-blue-600 via-blue-400 to-cyan-300',
    Red: 'from-red-600 via-red-400 to-orange-300',
    Green: 'from-green-600 via-green-400 to-emerald-300',
    Black: 'from-gray-900 via-gray-800 to-slate-700',
    Colorless: 'from-gray-500 via-gray-400 to-slate-300',
  };

  const colorBg: Record<string, string> = {
    White: 'bg-blue-50',
    Blue: 'bg-blue-900',
    Red: 'bg-red-900',
    Green: 'bg-green-900',
    Black: 'bg-gray-950',
    Colorless: 'bg-gray-800',
  };

  const rarityBadges: Record<string, { bg: string; text: string; icon: string }> = {
    Common: { bg: 'bg-slate-600', text: 'text-white', icon: 'C' },
    Uncommon: { bg: 'bg-green-600', text: 'text-white', icon: 'U' },
    Rare: { bg: 'bg-purple-600', text: 'text-white', icon: 'R' },
    'Special Rare': { bg: 'bg-yellow-500', text: 'text-black', icon: 'SR' },
    Promo: { bg: 'bg-pink-600', text: 'text-white', icon: 'P' },
  };

  const rarityInfo = rarityBadges[(card as any).rarity || 'Common'] || rarityBadges.Common;

  return (
    <aside className="rounded-lg border border-gcg-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gcg-light p-6 border-b border-gcg-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-gcg-text">{card.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{card.id}</p>
          </div>
          <div className={`rounded ${rarityInfo.bg} ${rarityInfo.text} px-3 py-2 font-bold text-center text-sm`}>
            {rarityInfo.icon}
            <br />
            {(card as any).rarity || 'Common'}
          </div>
        </div>
      </div>

      {/* Card Image */}
      <div className="relative mx-4 mt-6 overflow-hidden rounded-lg border border-gcg-border shadow-sm">
        <img
          src={card.placeholderArt}
          alt={card.name}
          className="h-auto w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://via.placeholder.com/600x800/f5f5f5/333333?text=${encodeURIComponent(card.name)}`;
          }}
        />
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Cost', value: card.cost },
            { label: 'Power', value: card.power },
            { label: 'Type', value: card.type },
            { label: 'Color', value: card.color },
          ].map(({ label, value }) => (
            <div key={label} className="rounded border border-gcg-border bg-gcg-light p-3 text-center">
              <p className="text-xs text-gray-600">{label}</p>
              <p className="mt-1 truncate text-base font-bold text-gcg-text">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card Text / Ability */}
      <div className="px-6 py-3 border-t border-gcg-border">
        <h3 className="mb-2 text-xs font-medium text-gray-600">Card Text</h3>
        <p className="rounded border border-gcg-border bg-gcg-light p-4 text-sm leading-relaxed text-gcg-text">
          {card.text || 'No ability text.'}
        </p>
      </div>

      {/* Set & Release Info */}
      <div className="px-6 py-3 border-t border-gcg-border grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-600">Included In</p>
          <p className="text-sm font-semibold text-gcg-text">{card.set}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Release Date</p>
          <p className="text-sm font-semibold text-gcg-text">
            {(card as any).releaseDate ? new Date((card as any).releaseDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Deck Control Buttons */}
      <div className="border-t border-gcg-border px-6 py-4">
        <div className="mb-3 flex items-center justify-between rounded border border-gcg-border bg-gcg-light px-4 py-2">
          <span className="text-sm font-medium text-gcg-text">In Deck:</span>
          <span className={`text-lg font-bold ${
            qty >= 3 ? 'text-gcg-primary' : 'text-gcg-text'
          }`}>{qty}/3</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => addCard(card.id)}
            disabled={qty >= 3}
            className="flex-1 rounded border border-gcg-primary bg-gcg-primary px-4 py-2 font-medium text-white hover:bg-gcg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Deck
          </button>
          <button
            onClick={() => removeCard(card.id)}
            disabled={qty === 0}
            className="flex-1 rounded border border-gcg-border bg-white px-4 py-2 font-medium text-gcg-text hover:bg-gcg-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Illustrator & Source */}
      <div className="border-t border-slate-700 px-6 py-3 text-xs text-slate-500">
        <p>
          Art by {(card as any).illustrator || 'Bandai Official'} • Source: {(card as any).source || 'bandai-official'}
        </p>
      </div>
    </aside>
  );
}
