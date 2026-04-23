import Link from 'next/link';
import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

export interface DeckCardProps {
  title: string;
  image: string;
  archetype: string;
  colors: string[];
  cardCount: number;
  views: number;
  createdAt: string;
  href?: string;
  className?: string;
}

const colorBadgeVariant: Record<string, 'blue' | 'red' | 'green' | 'white' | 'purple' | 'default'> = {
  Blue: 'blue',
  Red: 'red',
  Green: 'green',
  White: 'white',
  Purple: 'purple',
};

function DeckCardBody({ title, image, archetype, colors, cardCount, views, createdAt, className }: Omit<DeckCardProps, 'href'>): JSX.Element {
  const visibleColors = colors.length > 0 ? colors : ['Unclassified'];
  const viewsLabel = views <= 0 ? 'New' : `${views.toLocaleString()} views`;

  return (
    <article
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-lg border border-cobalt-900/70 bg-surface shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-cobalt-500/55 hover:shadow-[var(--shadow-hover)]',
        className,
      )}
    >
      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        decoding="async"
        loading="lazy"
        src={image}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-cobalt-950/10" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-cobalt-400/25" />

      <div className="absolute inset-x-0 bottom-0 z-10 space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge size="sm" variant="archetype">{archetype || 'Unclassified'}</Badge>
          {visibleColors.map((color) => (
            <Badge key={`${title}-${color}`} size="sm" variant={colorBadgeVariant[color] ?? 'default'}>
              {color}
            </Badge>
          ))}
        </div>

        <div>
          <h3 className="line-clamp-2 text-base font-semibold text-white">{title}</h3>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-100">
          <span>{cardCount} cards</span>
          <span>{viewsLabel}</span>
        </div>

        <p className="text-[11px] text-slate-300">{createdAt}</p>
      </div>
    </article>
  );
}

export function DeckCard(props: DeckCardProps): JSX.Element {
  if (props.href) {
    return (
      <Link aria-label={`Open deck ${props.title}`} className="block" href={props.href}>
        <DeckCardBody {...props} />
      </Link>
    );
  }

  return <DeckCardBody {...props} />;
}
