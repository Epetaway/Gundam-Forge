import React from 'react';

interface DeckCardProps {
  deck: {
    id: string;
    name: string;
    author: string;
    colors: string[];
    cardCount: number;
    views: number;
    updatedAt: string;
  };
  onClick: () => void;
}

const COLOR_MAP: Record<string, string> = {
  Blue: 'var(--gf-card-blue)',
  Red: 'var(--gf-card-red)',
  Green: 'var(--gf-card-green)',
  White: 'var(--gf-card-white)',
  Purple: 'var(--gf-card-purple)',
  Colorless: 'var(--gf-gray-400)',
};

export const DeckCard = React.memo(function DeckCard({ deck, onClick }: DeckCardProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-gf-white shadow-[0_0_0_1px_rgba(0,0,0,0.05),var(--gf-shadow-xs)] group w-full text-left p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1),var(--gf-shadow-card-hover)] active:scale-[0.98] active:shadow-xs"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {deck.colors.map((color) => (
            <span
              key={color}
              className="w-2.5 h-2.5 rounded-full border border-gf-border"
              style={{ backgroundColor: COLOR_MAP[color] || 'var(--gf-gray-400)' }}
              aria-label={color}
            />
          ))}
        </div>
        <span className="text-xs text-gf-gray-400">{deck.views} views</span>
      </div>

      <h3 className="text-base font-semibold text-gf-text leading-snug truncate">
        {deck.name}
      </h3>
      <p className="text-sm text-gf-text-secondary mt-0.5">
        by {deck.author}
      </p>

      <div className="flex items-center gap-2 mt-3 text-xs text-gf-text-muted">
        <span>{deck.cardCount} cards</span>
        <span aria-hidden="true">&middot;</span>
        <span>{deck.updatedAt}</span>
      </div>
    </button>
  );
});
