import React from 'react';

type SkeletonVariant = 'text' | 'card' | 'row' | 'image' | 'circle';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-3.5 w-full rounded',
  card: 'w-full rounded-lg',
  row: 'h-12 w-full rounded-md',
  image: 'w-full rounded-lg',
  circle: 'w-10 h-10 rounded-full',
};

export function SkeletonLoader({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  const baseClass = variantStyles[variant];
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;
  if (variant === 'card' && !height) style.aspectRatio = '5/7';
  if (variant === 'image' && !height) style.aspectRatio = '1/1';

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`gf-skeleton gf-animate-shimmer ${baseClass} ${className}`}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
