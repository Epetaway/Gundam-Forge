/**
 * CardImage - Production-Grade Card Image Component
 * 
 * Features:
 * - Automatic fallback to CDN and placeholder
 * - Never shows broken image or blank space
 * - Respects lazy loading
 * - Handles errors gracefully
 * - Works with Next.js Image optimization
 */

'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import {
  getProductionCardImageUrl,
  getCardImageFallback,
  getCardImageUltimateFallback,
} from '@/lib/images/cardImageUtils';

export interface CardImageProps {
  cardId: string;
  cardName?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  onError?: (error: Error) => void;
  /** Use Next.js Image component (better optimization) or HTML img (simpler) */
  useNextImage?: boolean;
}

/**
 * CardImage Component - Uses Next.js Image for optimization
 * Automatically handles fallbacks and never displays broken images
 */
export const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  (
    {
      cardId,
      cardName,
      alt = cardName || cardId,
      className = '',
      containerClassName = '',
      width = 300,
      height = 420,
      priority = false,
      loading = priority ? 'eager' : 'lazy',
      onClick,
      onError,
      useNextImage = true,
    },
    ref
  ) => {
    const [src, setSrc] = useState<string>(() =>
      getProductionCardImageUrl({ id: cardId, name: cardName })
    );
    const [retryCount, setRetryCount] = useState(0);
    const [isError, setIsError] = useState(false);

    const handleImageError = useCallback(() => {
      setRetryCount((prev) => {
        const next = prev + 1;

        if (next === 1) {
          // First retry: try CDN
          setSrc(getCardImageFallback(cardId, cardName));
        } else if (next === 2) {
          // Second retry: ultimate fallback (SVG)
          setSrc(getCardImageUltimateFallback(cardId, cardName));
          setIsError(true);
          onError?.(new Error(`Failed to load card image: ${cardId}`));
        }

        return next;
      });
    }, [cardId, cardName, onError]);

    if (useNextImage) {
      return (
        <div
          className={cn(
            'relative overflow-hidden rounded-lg',
            `aspect-[${width}/${height}]`,
            containerClassName
          )}
        >
          <Image
            ref={ref}
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            loading={loading as 'lazy' | 'eager'}
            className={cn(
              'object-cover object-center',
              'transition-opacity duration-300',
              isError && 'opacity-75',
              className
            )}
            onError={handleImageError}
            onClick={onClick}
            quality={85}
            sizes={`(max-width: 640px) ${width / 2}px, ${width}px`}
          />
        </div>
      );
    }

    // Fallback to plain img tag (simpler, no Next.js optimization)
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={cn(
          'object-cover object-center rounded-lg',
          'transition-opacity duration-300',
          isError && 'opacity-75',
          className
        )}
        onError={handleImageError}
        onClick={onClick}
        style={{
          aspectRatio: `${width} / ${height}`,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      />
    );
  }
);

CardImage.displayName = 'CardImage';

/**
 * CardImageGrid - Display multiple card images in a grid
 * Optimized for performance with lazy loading
 */
export const CardImageGrid = React.forwardRef<
  HTMLDivElement,
  {
    cardIds: string[];
    cardMap?: Record<string, { name?: string }>;
    columns?: number;
    gap?: number;
    className?: string;
    cardClassName?: string;
    onCardClick?: (cardId: string) => void;
    loading?: 'lazy' | 'eager';
  }
>(
  (
    {
      cardIds,
      cardMap = {},
      columns = 4,
      gap = 3,
      className = '',
      cardClassName = '',
      onCardClick,
      loading = 'lazy',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid w-full',
          `grid-cols-${columns}`,
          `gap-${gap}`,
          className
        )}
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))`,
          gap: `${gap * 0.25}rem`,
        }}
      >
        {cardIds.map((cardId) => (
          <div
            key={cardId}
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onCardClick?.(cardId)}
          >
            <CardImage
              cardId={cardId}
              cardName={cardMap[cardId]?.name}
              className={cardClassName}
              width={150}
              height={210}
              loading={loading}
            />
          </div>
        ))}
      </div>
    );
  }
);

CardImageGrid.displayName = 'CardImageGrid';

/**
 * CardImagePlaceholder - Lightweight skeleton while loading
 * Shows correct aspect ratio to prevent layout shift
 */
export const CardImagePlaceholder: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 300, height = 420, className = '' }) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        'bg-gradient-to-br from-slate-200 to-slate-300',
        'animate-pulse',
        className
      )}
      style={{
        aspectRatio: `${width} / ${height}`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="text-sm font-semibold">Loading...</div>
        </div>
      </div>
    </div>
  );
};

CardImagePlaceholder.displayName = 'CardImagePlaceholder';

/**
 * CardImageWithFallback - Component that shows placeholder while loading
 * Best for important card displays where layout shift matters
 */
export const CardImageWithFallback: React.FC<CardImageProps> = (props) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && (
        <CardImagePlaceholder
          width={props.width}
          height={props.height}
          className={props.containerClassName}
        />
      )}
      <div
        className={cn(isLoading && 'hidden')}
        onLoad={() => setIsLoading(false)}
      >
        <CardImage {...props} />
      </div>
    </>
  );
};

CardImageWithFallback.displayName = 'CardImageWithFallback';

export default CardImage;
