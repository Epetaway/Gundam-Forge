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
  return COLOR_MAP[color] || "bg-[#6b7280]";
}

export interface DeckPreviewCardProps {
  heroUrl: string;
  title: string;
  subtitle: string;
  author: string;
  views: number;
  cardCount: number;
  updatedAgo?: string;
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
  const metaLine = [
    `${views.toLocaleString()} views`,
    `${cardCount} cards`,
    updatedAgo,
  ].filter(Boolean).join(' • ');

  return (
    <article
      className="group relative cursor-pointer rounded-xl bg-surface-elevated ring-1 ring-border shadow-md overflow-hidden hover:scale-[1.02] transition-transform hover:shadow-lg"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Open deck: ${title}`}
    >
      {/* Hero section with image and text overlay */}
      <div className="relative overflow-hidden">
        <div className="relative h-36 w-full bg-gradient-to-br from-steel-200 to-steel-300">
          <img
            src={heroUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
          {/* Deck name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8">
            <h2 className="text-xl font-bold text-white truncate">{title}</h2>
          </div>
          {/* Kebab menu */}
          <button
            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors"
            onClick={e => {
              e.stopPropagation();
              onMenu?.(e);
            }}
            tabIndex={0}
            aria-label="Deck options"
            type="button"
          >
            <span className="text-base leading-none">⋮</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Archetype badge + metadata */}
        <div className="flex items-center justify-between gap-2">
          {subtitle ? (
            <span className="rounded-full bg-surface-interactive px-2.5 py-0.5 text-xs font-medium text-foreground truncate max-w-[60%]">
              {subtitle}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs text-steel-400 text-right whitespace-nowrap">{metaLine}</span>
        </div>

        {/* Color badges */}
        <div className="flex flex-wrap gap-1.5">
          {colors.length > 0 ? (
            colors.map((color, i) => (
              <span
                key={color + i}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${colorToClass(color)}`}
                title={color}
              >
                {color}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-surface-interactive px-2.5 py-0.5 text-xs font-medium text-steel-400">
              Colorless
            </span>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 pt-0.5 border-t border-border">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={author}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-steel-300 flex items-center justify-center text-[10px] font-bold text-steel-600">
              {author.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-steel-400 truncate">{author}</span>
        </div>

        {/* Tags strip */}
        {isLoading ? (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="rounded-full bg-surface-interactive animate-pulse px-3 py-1 text-xs min-w-[48px] h-5"
              />
            ))}
          </div>
        ) : tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="rounded-full bg-surface-interactive px-2.5 py-0.5 text-xs text-steel-400 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
