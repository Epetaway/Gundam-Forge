import Link from 'next/link';
import React from "react";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  Blue: {
    bg: "bg-cobalt-700/40",
    border: "border-cobalt-400/60",
    text: "text-white",
  },
  Green: {
    bg: "bg-green-700/40",
    border: "border-green-400/60",
    text: "text-white",
  },
  Red: {
    bg: "bg-red-700/40",
    border: "border-red-400/60",
    text: "text-white",
  },
  White: {
    bg: "bg-steel-700/40",
    border: "border-steel-400/60",
    text: "text-white",
  },
  Purple: {
    bg: "bg-purple-700/40",
    border: "border-purple-400/60",
    text: "text-white",
  },
  Colorless: {
    bg: "bg-steel-600/40",
    border: "border-steel-400/60",
    text: "text-white",
  },
};

function colorToClasses(color: string) {
  return (
    COLOR_MAP[color] || {
      bg: "bg-steel-600/40",
      border: "border-steel-400/60",
      text: "text-white",
    }
  );
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
  const metaLine = [
    `${views.toLocaleString()} views`,
    `${cardCount} cards`,
    updatedAgo,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <article
      className="group relative rounded-lg overflow-hidden border border-border transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-cobalt-500/40 focus-within:ring-2 focus-within:ring-cobalt-400/60 will-change-transform cursor-pointer"
      aria-label={`Deck: ${title}`}
    >
      {/* Hero Image with Overlay */}
      <div className="relative h-40 w-full overflow-hidden bg-surface-muted">
        <img
          src={heroUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          style={{ filter: "contrast(1.1) saturate(1.15)" }}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-cobalt-700 via-cobalt-700/40 to-transparent dark:from-cobalt-900 dark:via-cobalt-900/40" />
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />

        {/* Title overlay */}
        <div className="absolute inset-0 flex items-end p-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight truncate drop-shadow-lg">
              {title}
            </h2>
            <p className="text-xs text-white/80 truncate mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Menu button — must be z-20 to stay above the click overlay below */}
        {onMenu ? (
          <button
            className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onMenu(e);
            }}
            aria-label="Deck options"
            type="button"
          >
            <span className="text-lg" aria-hidden="true">⋮</span>
          </button>
        ) : null}
      </div>

      {/* Content Section */}
      <div className="bg-surface-elevated dark:bg-surface-elevated/80 p-4 space-y-3">
        {/* Author info */}
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={author}
              className="h-8 w-8 rounded-full object-cover border border-border/50"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-surface-muted border border-border/50 flex items-center justify-center text-xs font-bold text-text-subtle" aria-hidden="true">
              {author.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-text-muted truncate">
            {author}
          </span>
        </div>

        {/* Color badges */}
        <div className="flex flex-wrap gap-1.5" aria-label="Deck colors">
          {colors.length > 0 ? (
            colors.map((color, i) => {
              const classes = colorToClasses(color);
              return (
                <span
                  key={color + i}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${classes.bg} ${classes.border} ${classes.text}`}
                >
                  <span aria-hidden="true">● </span>
                  <span className="ml-1.5">{color}</span>
                </span>
              );
            })
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold bg-steel-600/40 border-steel-400/60 text-white">
              <span aria-hidden="true">● </span>
              <span className="ml-1.5">Colorless</span>
            </span>
          )}
        </div>

        {/* Archetype badge */}
        {archetype && (
          <div className="flex">
            <span className="inline-block px-2.5 py-1 rounded-full bg-surface-interactive text-foreground text-xs font-medium">
              {archetype}
            </span>
          </div>
        )}

        {/* Metadata line */}
        <div className="flex justify-end pt-2 border-t border-border/30">
          <span className="text-xs text-text-secondary dark:text-text-secondary">
            {metaLine}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <span
                  key={i}
                  className="rounded-full bg-surface-muted animate-pulse px-2 py-1 text-xs text-surface-muted min-w-[40px] h-5"
                />
              ))
            : tags && tags.length > 0
            ? tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-muted text-text-subtle px-2 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))
            : null}
        </div>
      </div>

      {/* Full-card click overlay — last in DOM so it stacks on top; z-10 below menu (z-20) */}
      {href ? (
        <Link
          href={href}
          className="absolute inset-0 z-10 cursor-pointer rounded-lg"
          aria-label={`Open deck: ${title}`}
          tabIndex={0}
        />
      ) : onClick ? (
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer rounded-lg"
          onClick={onClick}
          aria-label={`Open deck: ${title}`}
          tabIndex={0}
        />
      ) : null}
    </article>
  );
}
