import * as React from 'react';
import { DeckCard } from '@/components/ui/DeckCard';

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
  views,
  cardCount,
  updatedAgo,
  colors,
  archetype,
  href,
}: DeckPreviewCardProps): JSX.Element {
  return (
    <DeckCard
      archetype={archetype || 'Unclassified'}
      cardCount={cardCount}
      colors={colors}
      createdAt={updatedAgo || 'Recently updated'}
      href={href}
      image={heroUrl}
      title={title}
      views={views}
    />
  );
}
