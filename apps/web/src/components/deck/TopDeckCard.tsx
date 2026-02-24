import { Link } from 'react-router-dom';
import type { PublicDeckRecord } from '../../services/deckService';
import { useCardsStore } from '../../features/deckbuilder/cardsStore';
import { resolveCardImage } from '../../utils/resolveCardImage';
import { TIER_LABELS, TIER_COLORS, type MetaTier } from '../../data/metaTierList';

const COLOR_DOT: Record<string, string> = {
  Blue: 'bg-blue-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  White: 'bg-gray-300',
  Purple: 'bg-purple-500',
  Colorless: 'bg-gray-400',
};

const COLOR_VALUE: Record<string, string> = {
  Blue: '#3B82F6',
  Red: '#EF4444',
  Green: '#22C55E',
  White: '#D1D5DB',
  Purple: '#A855F7',
  Colorless: '#9CA3AF',
};

interface TopDeckCardProps {
  deck: PublicDeckRecord;
}

export function TopDeckCard({ deck }: TopDeckCardProps) {
  const cardsById = useCardsStore((s) => s.cardsById);
  const colors: string[] = deck.colors ?? [];

  // Resolve the first boss card image from the card database
  let heroSrc: string | undefined;
  let heroName: string | undefined;
  if (deck.boss_card_ids) {
    for (const cardId of deck.boss_card_ids) {
      const card = cardsById.get(cardId);
      if (card) {
        const src = resolveCardImage(card);
        if (src) {
          heroSrc = src;
          heroName = card.name;
          break;
        }
      }
    }
  }

  // Build a subtle gradient fallback from the deck colors
  const gradientBg = colors.length >= 2
    ? `linear-gradient(135deg, ${COLOR_VALUE[colors[0]] ?? '#6B7280'}55, ${COLOR_VALUE[colors[1]] ?? '#6B7280'}55)`
    : colors.length === 1
      ? `linear-gradient(135deg, ${COLOR_VALUE[colors[0]] ?? '#6B7280'}55, ${COLOR_VALUE[colors[0]] ?? '#6B7280'}22)`
      : 'linear-gradient(135deg, #6B728055, #6B728022)';

  return (
    <Link
      to={`/decks/${deck.id}`}
      className="group block"
    >
      <div className="gf-card-tile bg-white">
        <div className="relative w-full" style={{ aspectRatio: '5/7' }}>
          {/* Boss card art or gradient fallback */}
          {heroSrc ? (
            <img
              src={heroSrc}
              alt={heroName ?? deck.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: gradientBg }}
            >
              <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {/* Bottom gradient overlay for text */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Tier badge */}
          {deck.meta_tier && (
            <span className={`absolute top-1.5 right-1.5 z-[3] flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-[9px] font-bold border ${TIER_COLORS[deck.meta_tier as MetaTier]}`}>
              {TIER_LABELS[deck.meta_tier as MetaTier]}
            </span>
          )}

          {/* Official badge */}
          {deck.source === 'official' && (
            <span className="absolute top-1.5 left-1.5 z-[3] flex h-5 items-center gap-0.5 rounded bg-yellow-400/90 px-1.5 text-[8px] font-bold text-yellow-900">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
              GCG
            </span>
          )}

          {/* Bottom text overlay */}
          <div className="absolute inset-x-0 bottom-0 z-[2] p-2.5">
            {/* Color dots */}
            <div className="flex items-center gap-1 mb-1">
              {colors.map((c) => (
                <span
                  key={c}
                  className={`h-2 w-2 rounded-full border border-white/40 ${COLOR_DOT[c] || 'bg-gray-400'}`}
                />
              ))}
            </div>
            <h3 className="text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow-sm">
              {deck.name}
            </h3>
          </div>
        </div>
      </div>

      {/* Below-tile info */}
      <div className="mt-1.5">
        {deck.archetype && (
          <p className="truncate text-[9px] text-gf-text-muted">{deck.archetype}</p>
        )}
      </div>
    </Link>
  );
}
