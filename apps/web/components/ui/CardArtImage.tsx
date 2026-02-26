'use client';

import * as React from 'react';
import Image, { type ImageProps } from 'next/image';
import type { CardDefinition } from '@gundam-forge/shared';
import { getCardFallback, getCardImage } from '@/lib/data/cards';

type CardArtRef = Pick<CardDefinition, 'id' | 'name' | 'imageUrl' | 'placeholderArt'>;

type CardArtImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  card: CardArtRef;
  alt?: string;
};

function buildInlineFallback(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840"><rect width="600" height="840" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#374151" font-family="Arial,sans-serif" font-size="28">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function uniqueSources(sources: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const src of sources) {
    const normalized = src.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function CardArtImage(props: CardArtImageProps): JSX.Element {
  const { card, alt, onError, ...imageProps } = props;

  const sources = React.useMemo(() => {
    const initial = getCardImage(card);
    const fallbacks = getCardFallback(card);
    const inline = buildInlineFallback(card.name);
    return uniqueSources([initial, ...fallbacks, inline]);
  }, [card]);

  const [sourceIndex, setSourceIndex] = React.useState(0);

  React.useEffect(() => {
    setSourceIndex(0);
  }, [sources]);

  const src = sources[Math.min(sourceIndex, sources.length - 1)];

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setSourceIndex((current) => (current < sources.length - 1 ? current + 1 : current));
    onError?.(event);
  };

  return (
    <Image
      {...imageProps}
      alt={alt ?? card.name}
      onError={handleError}
      src={src}
    />
  );
}
