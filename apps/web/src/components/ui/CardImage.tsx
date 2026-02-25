import React, { useEffect, useState } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { getCardFallbacks } from '../../utils/resolveCardImage';

interface CardImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  card: CardDefinition;
  alt?: string;
  /** Called when every fallback URL has been exhausted */
  onAllFailed?: () => void;
}

/**
 * CardImage — self-healing card art component.
 *
 * Fallback chain (managed internally):
 *   1. Local /card_art/{id}.webp  — fastest, served from own origin
 *   2. exburst.dev remote URL     — canonical upstream source
 *   3. placeholderArt             — always-available SVG
 *   4. Inline text tile           — last resort, never blank
 */
export const CardImage = React.memo(function CardImage({
  card,
  alt,
  onAllFailed,
  ...imgProps
}: CardImageProps) {
  const fallbacks = getCardFallbacks(card);
  const [srcIndex, setSrcIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  // Reset state when the card changes so stale fallback indices don't carry over.
  useEffect(() => {
    setSrcIndex(0);
    setExhausted(false);
  }, [card.id]);

  function handleError() {
    const next = srcIndex + 1;
    if (next < fallbacks.length) {
      setSrcIndex(next);
    } else {
      setExhausted(true);
      onAllFailed?.();
    }
  }

  if (exhausted) {
    // Inline text tile — retains layout space, never causes a blank hole.
    return (
      <div
        role="img"
        aria-label={alt ?? card.name}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f2937',
          color: '#9ca3af',
          fontSize: '0.625rem',
          textAlign: 'center',
          padding: '0.25rem',
          overflow: 'hidden',
          ...imgProps.style,
        }}
        className={imgProps.className}
      >
        {card.name}
      </div>
    );
  }

  return (
    <img
      {...imgProps}
      src={fallbacks[srcIndex]}
      alt={alt ?? card.name}
      onError={handleError}
    />
  );
});
