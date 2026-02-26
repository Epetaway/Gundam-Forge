'use client';

import Link from 'next/link';
import { Download, ExternalLink, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface DeckHeaderProps {
  name: string;
  description: string;
  colors: string[];
  archetype: string;
  owner: string;
  totalCards: number;
  onShare: () => void;
  onExport: () => void;
  feedback: string;
}

export function DeckHeader({
  name,
  description,
  colors,
  archetype,
  owner,
  totalCards,
  onShare,
  onExport,
  feedback,
}: DeckHeaderProps): JSX.Element {
  return (
    <header className="sticky top-16 z-20 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="flex flex-col gap-3 py-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cobalt-300">Deck Viewer</p>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-[0.04em] text-foreground">{name}</h1>
          <p className="max-w-3xl text-sm text-steel-600">{description}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{archetype}</Badge>
            {colors.map((color) => (
              <Badge key={color} variant="default">{color}</Badge>
            ))}
            <span className="text-xs text-steel-600">{totalCards} cards</span>
            <span className="text-xs text-steel-600">Owner: {owner}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onShare} size="sm" variant="secondary">
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
          <Button onClick={onExport} size="sm" variant="secondary">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button asChild size="sm" variant="primary">
            <Link href="/forge">
              Open in Forge
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
      {feedback ? <p className="pb-2 text-xs text-cobalt-300">{feedback}</p> : null}
    </header>
  );
}
