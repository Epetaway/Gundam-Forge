import Link from 'next/link';
import React from "react";

const COLOR_DOT: Record<string, string> = {
  Blue: "bg-cobalt-400",
  Green: "bg-green-400",
  Red: "bg-red-400",
  White: "bg-steel-300",
  Purple: "bg-purple-400",
  Colorless: "bg-steel-500",
};

const COLOR_PILL: Record<string, { bg: string; border: string; text: string }> = {
  Blue: { bg: "bg-cobalt-700/60", border: "border-cobalt-400/50", text: "text-white" },
  Green: { bg: "bg-green-700/60", border: "border-green-400/50", text: "text-white" },
  Red: { bg: "bg-red-700/60", border: "border-red-400/50", text: "text-white" },
  White: { bg: "bg-steel-700/60", border: "border-steel-400/50", text: "text-white" },
  Purple: { bg: "bg-purple-700/60", border: "border-purple-400/50", text: "text-white" },
  Colorless: { bg: "bg-steel-600/60", border: "border-steel-400/50", text: "text-white" },
};

function colorDot(color: string) {
  return COLOR_DOT[color] ?? "bg-steel-500";
}

function colorPill(color: string) {
  return COLOR_PILL[color] ?? { bg: "bg-steel-600/60", border: "border-steel-400/50", text: "text-white" };
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
  archetype?: string;
  onClick?: () => void;
  href?: string;
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
  archetype,
  onClick,
  href,
  onMenu,
  isLoading,
}: DeckPreviewCardProps & { isLoading?: boolean }) {
  const displayColors = colors.length > 0 ? colors : ['Colorless'];

  return (
    <article
      className="group relative overflow-hidden rounded-xl cursor-pointer will-change-transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/50 focus-within:ring-2 focus-within:ring-cobalt-400/60"
      style={{ aspectRatio: '3/4' }}
      aria-label={`Deck: ${title}`}
    >
      {/* Full-bleed image */}
      {isLoading ? (
        <div className="absolute inset-0 bg-surface-muted animate-pulse" />
      ) : (
        <img
          src={heroUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          style={{ filter: "contrast(1.05) saturate(1.2)" }}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}

      {/* Persistent gradient — strong at bottom, fades out at top third */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 pointer-events-none" />

      {/* Menu button — top-right, always visible */}
      {onMenu ? (
        <button
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/60 text-white/70 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onMenu(e);
          }}
          aria-label="Deck options"
          type="button"
        >
          <span className="text-base leading-none" aria-hidden="true">⋮</span>
        </button>
      ) : null}

      {/* Bottom content area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2">

        {/* HOVER-REVEAL: author + stats — slides up from below */}
        <div className="transform translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-2 mb-1.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={author}
                className="h-6 w-6 rounded-full object-cover border border-white/20 flex-shrink-0"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" aria-hidden="true">
                {author.substring(0, 2).charAt(0).toUpperCase() + author.substring(1, 2).toLowerCase()}
              </div>
            )}
            <span className="text-xs text-white/80 truncate">{author}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/55 font-mono">
            {views < 5 ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-cobalt-600/60 border border-cobalt-400/40 text-cobalt-200 text-[10px] font-semibold uppercase tracking-wide">New</span>
            ) : (
              <span>{views.toLocaleString()} views</span>
            )}
            <span aria-hidden="true">·</span>
            <span>{cardCount} cards</span>
            {updatedAgo ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{updatedAgo}</span>
              </>
            ) : null}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 border border-white/15 text-white/70 px-2 py-0.5 text-[10px] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* ALWAYS VISIBLE: title */}
        <h2 className="text-base font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
          {title}
        </h2>

        {/* ALWAYS VISIBLE: archetype + color row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {archetype ? (
            <span className="inline-block px-2 py-0.5 rounded-full bg-cobalt-600/70 border border-cobalt-400/40 text-white text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
              {archetype}
            </span>
          ) : null}

          <div className="flex items-center gap-1" aria-label="Deck colors">
            {displayColors.map((color, i) => (
              <span
                key={color + i}
                className={`h-2.5 w-2.5 rounded-full ring-1 ring-black/30 ${colorDot(color)}`}
                title={color}
              />
            ))}
          </div>

          {/* Color pills — hover only */}
          <div className="hidden group-hover:flex items-center gap-1 flex-wrap ml-0.5 transition-all duration-200">
            {displayColors.map((color, i) => {
              const pill = colorPill(color);
              return (
                <span
                  key={color + i}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${pill.bg} ${pill.border} ${pill.text}`}
                >
                  {color}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-card click overlay — z-10 (below menu at z-20) */}
      {href ? (
        <Link
          href={href}
          className="absolute inset-0 z-10 rounded-xl"
          aria-label={`Open deck: ${title}`}
          tabIndex={0}
        />
      ) : onClick ? (
        <button
          type="button"
          className="absolute inset-0 z-10 rounded-xl"
          onClick={onClick}
          aria-label={`Open deck: ${title}`}
          tabIndex={0}
        />
      ) : null}
    </article>
  );
}
