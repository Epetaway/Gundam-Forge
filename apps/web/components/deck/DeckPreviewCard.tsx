import React from "react";

const COLOR_MAP: Record<string, string> = {
  Blue: "bg-[#3b82f6]",
  Green: "bg-[#22c55e]",
  Red: "bg-[#ef4444]",
  White: "bg-[#cbd5e1]",
  Purple: "bg-[#a855f7]",
  Colorless: "bg-[#6b7280]",
};
function colorToClass(color: string) {
  return COLOR_MAP[color] || "bg-neutral-300";
}

export interface DeckPreviewCardProps {
  heroUrl: string;
  title: string;
  subtitle: string;
  author: string;
  views: number;
  cardCount: number;
  updatedAgo: string;
  colors: string[];
  tags?: string[];
  avatarUrl?: string;
  onClick?: () => void;
  onMenu?: (e: React.MouseEvent) => void;
}

export function DeckPreviewCard({
  heroUrl,
  title,
  subtitle,
  author,
  views,
  cardCount,
  updatedAgo,
  colors,
  tags,
  avatarUrl,
  onClick,
  onMenu,
  isLoading,
}: DeckPreviewCardProps & { isLoading?: boolean }) {
  return (
    <article
      className="group relative cursor-pointer rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-xl shadow-black/30 overflow-hidden transition-shadow hover:shadow-2xl"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Open deck: ${title}`}
    >
      {/* Hero banner */}
      <div className="relative h-28 w-full">
        <img
          src={heroUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ filter: 'contrast(1.08) saturate(1.08)' }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      </div>

      {/* Meta line */}
      <div className="mt-3 flex justify-center">
        <span className="text-sm text-neutral-300 text-center">
          {views.toLocaleString()} views &bull; {cardCount} cards &bull; {updatedAgo}
        </span>
      </div>

      {/* Color identity bar */}
      <div className="mt-3 flex h-6 w-full gap-1 px-4">
        {colors.length > 0 ? (
          colors.map((color, i) => (
            <div
              key={color + i}
              className={`flex-1 h-full rounded-md ring-1 ring-white/10 ${colorToClass(color)}`}
              title={color}
            />
          ))
        ) : (
          <div className="flex-1 h-full rounded-md ring-1 ring-white/10 bg-neutral-800" />
        )}
      </div>

      {/* Title block */}
      <div className="flex items-center gap-4 px-5 mt-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={author}
              className="h-12 w-12 rounded-full object-cover border border-neutral-800"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-neutral-700 border border-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-300">
              {author.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {/* Title and subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white truncate">{title}</h2>
            {/* Kebab menu */}
            <button
              className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-neutral-400"
              onClick={e => {
                e.stopPropagation();
                onMenu?.(e);
              }}
              tabIndex={0}
              aria-label="Deck options"
              type="button"
            >
              <span className="text-lg">⋮</span>
            </button>
          </div>
          <div className="text-sm text-neutral-300 truncate">{subtitle}</div>
          <div className="text-sm text-neutral-400 truncate">{author}</div>
        </div>
      </div>

      {/* Bottom tags strip */}
      <div className="mt-5 border-t border-neutral-800 px-5 py-2 flex flex-wrap justify-center gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="rounded-full bg-neutral-700/40 animate-pulse px-3 py-1 text-xs text-neutral-500 font-medium min-w-[48px] h-6"
              />
            ))
          : tags && tags.length > 0
          ? tags.map(tag => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200 font-medium"
              >
                {tag}
              </span>
            ))
          : <span className="text-neutral-600 text-sm">No deck tags</span>
        }
      </div>
    </article>
  );
}
