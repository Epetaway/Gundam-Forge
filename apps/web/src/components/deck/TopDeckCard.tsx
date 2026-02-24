import { Link } from 'react-router-dom';
import type { PublicDeckRecord } from '../../services/deckService';

const COLOR_VALUE: Record<string, string> = {
  Blue: 'var(--gf-card-blue)',
  Red: 'var(--gf-card-red)',
  Green: 'var(--gf-card-green)',
  White: '#D1D5DB',
  Purple: 'var(--gf-card-purple)',
  Colorless: 'var(--gf-gray-400)',
};

const COLOR_DOT: Record<string, string> = {
  Blue: 'bg-blue-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  White: 'bg-gray-300',
  Purple: 'bg-purple-500',
  Colorless: 'bg-gray-400',
};

function buildColorBar(colors: string[]): string {
  if (colors.length === 0) return 'var(--gf-gray-300)';
  if (colors.length === 1) return COLOR_VALUE[colors[0]] || 'var(--gf-gray-300)';
  const stops = colors.map((c, i) => {
    const val = COLOR_VALUE[c] || 'var(--gf-gray-300)';
    const pct = Math.round((i / (colors.length - 1)) * 100);
    return `${val} ${pct}%`;
  });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

interface TopDeckCardProps {
  deck: PublicDeckRecord;
}

export function TopDeckCard({ deck }: TopDeckCardProps) {
  const author =
    deck.source === 'official'
      ? 'Official GCG'
      : deck.profiles?.display_name || deck.profiles?.username || 'Anonymous';
  const colors: string[] = deck.colors ?? [];

  return (
    <Link
      to={`/decks/${deck.id}`}
      className="group block w-[220px] rounded-xl bg-white border border-gf-border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98]"
    >
      {/* Color identity bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: buildColorBar(colors) }}
      />

      {/* Card content */}
      <div className="p-4">
        {/* Name + Official badge */}
        <div className="flex items-start gap-1.5 mb-1.5">
          {deck.source === 'official' && (
            <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          )}
          <h3 className="text-sm font-bold text-gf-text leading-snug line-clamp-2 group-hover:text-gf-blue transition-colors">
            {deck.name}
          </h3>
        </div>

        {/* Archetype pill */}
        {deck.archetype && (
          <span className="inline-block rounded-full bg-gf-blue/5 border border-gf-blue/20 px-2 py-0.5 text-[9px] font-medium text-gf-blue mb-3">
            {deck.archetype}
          </span>
        )}
        {!deck.archetype && <div className="mb-3" />}

        {/* Separator */}
        <div className="border-t border-gf-border mb-3" />

        {/* Author */}
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="h-3 w-3 text-gf-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[11px] text-gf-text-secondary truncate">{author}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Likes */}
            <span className="flex items-center gap-1 text-[10px] text-gf-text-muted">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {deck.like_count ?? 0}
            </span>
            {/* Views */}
            <span className="flex items-center gap-1 text-[10px] text-gf-text-muted">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {deck.view_count ?? 0}
            </span>
          </div>

          {/* Color dots */}
          <div className="flex items-center gap-1">
            {colors.map((c) => (
              <span
                key={c}
                className={`h-2.5 w-2.5 rounded-full border border-white/50 ${COLOR_DOT[c] || 'bg-gray-400'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
