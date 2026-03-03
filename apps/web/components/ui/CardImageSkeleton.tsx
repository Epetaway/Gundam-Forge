'use client';

import { cn } from '@/lib/utils/cn';

interface CardImageSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function CardImageSkeleton({
  className,
  width = 'w-full',
  height = 'aspect-[5/7]',
}: CardImageSkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-interactive',
        height,
        width,
        className,
      )}
    >
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface-interactive via-surface-elevated to-surface-interactive bg-[length:200%_100%] animate-pulse" />
      
      {/* Shine animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
}
