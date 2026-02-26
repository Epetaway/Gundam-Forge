'use client';

import * as React from 'react';
import Image, { type ImageProps } from 'next/image';
import type { CardDefinition } from '@gundam-forge/shared';
import { getCardImage } from '@/lib/data/cards';

type CardArtRef = Pick<CardDefinition, 'id' | 'name' | 'imageUrl' | 'placeholderArt'>;

type CardArtImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  card: CardArtRef;
  alt?: string;
};

function buildInlineFallback(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840"><rect width="600" height="840" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#374151" font-family="Arial,sans-serif" font-size="28">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function CardArtImage(props: CardArtImageProps): JSX.Element {
  const { card, alt, onError, ...imageProps } = props;

  const primarySource = React.useMemo(() => getCardImage(card), [card]);
  const inlineFallback = React.useMemo(() => buildInlineFallback(card.name), [card.name]);
  const [source, setSource] = React.useState(primarySource);

  React.useEffect(() => {
    setSource(primarySource);
  }, [primarySource]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (source !== inlineFallback) {
      setSource(inlineFallback);
    }
    onError?.(event);
  };

  return (
    <Image
      {...imageProps}
      alt={alt ?? card.name}
      onError={handleError}
      src={source}
    />
  );
}
