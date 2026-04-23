'use client';

import { useState } from 'react';
import { getDeckShareUrl } from '@/lib/api/deck-operations';
import { Button } from '@/components/ui/Button';

interface DeckShareCardProps {
  deckId: string;
  deckName: string;
  isPublic: boolean;
}

export function DeckShareCard({ deckId, deckName, isPublic }: DeckShareCardProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = getDeckShareUrl(deckId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (!isPublic) {
    return (
      <div className="rounded-lg border border-border bg-surface-elevated p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-lg">🔒</div>
          <h3 className="font-semibold text-foreground">Private Deck</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          This deck is private and cannot be shared. Toggle the visibility above to make it public.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-lg">🔗</div>
        <h3 className="font-semibold text-foreground">Share Deck</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Anyone with this link can view and clone "{deckName}".
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-4 py-2 text-sm bg-surface border border-border rounded text-foreground font-mono"
          onClick={(e) => e.currentTarget.select()}
        />
        <Button onClick={handleCopy} variant="secondary" size="sm">
          {copied ? '✓ Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
