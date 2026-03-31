'use client';

/**
 * Shared CardHoverPreview component
 *
 * Renders a portal-based card image preview positioned near the hovered element.
 * Used across all card display views for consistent hover behavior.
 *
 * Features:
 * - Smart left/right positioning based on viewport boundaries
 * - Vertical centering relative to anchor element
 * - Fixed z-index (300) for visibility
 * - No pointer events (hover-through)
 * - Fallback to placeholder art or text display
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getCardImage } from '@/lib/data/cards';
import type { CardDefinition } from '@gundam-forge/shared';

export interface CardHoverPreviewProps {
  card: CardDefinition;
  anchor: DOMRect;
  /** Width of the preview card in pixels. Default: 200 */
  width?: number;
  /** Gap between anchor and preview in pixels. Default: 12 */
  gap?: number;
  /** Prefer showing preview on right side. Default: false (prefer left) */
  preferRight?: boolean;
}

export function CardHoverPreview({
  card,
  anchor,
  width = 200,
  gap = 12,
  preferRight = false,
}: CardHoverPreviewProps): React.ReactPortal {
  // Calculate horizontal position with smart left/right flipping
  const left = React.useMemo(() => {
    if (preferRight) {
      // Prefer right side; flip to left if would go off-screen
      return anchor.right + gap + width > window.innerWidth
        ? anchor.left - width - gap
        : anchor.right + gap;
    } else {
      // Prefer left side; flip to right if would go off-screen
      return anchor.left - width - gap < 8
        ? anchor.right + gap
        : anchor.left - width - gap;
    }
  }, [anchor, width, gap, preferRight]);

  // Calculate vertical position with centering and bounds checking
  const top = React.useMemo(() => {
    const cardHeight = width * 1.4; // Approximate aspect ratio 5:7
    const rawTop = anchor.top + anchor.height / 2 - cardHeight / 2;
    return Math.max(8, Math.min(rawTop, window.innerHeight - cardHeight - 8));
  }, [anchor, width]);

  const imageUrl = getCardImage(card);
  const hasImage = imageUrl !== '';

  const content = (
    <div
      className="pointer-events-none fixed z-[300] overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10"
      style={{ left, top, width }}
    >
      {hasImage ? (
        <img
          src={imageUrl}
          alt={card.name}
          className="w-full h-auto"
          draggable={false}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-1 bg-surface-interactive p-3 text-center"
          style={{ aspectRatio: '5/7' }}
        >
          <p className="text-xs font-semibold leading-tight text-foreground">{card.name}</p>
          {card.type && (
            <p className="text-[10px] text-text-muted">
              {card.type} · {card.color}
            </p>
          )}
          {card.ap !== undefined && card.hp !== undefined && (
            <p className="text-[10px] text-text-muted">
              AP {card.ap} / HP {card.hp}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
