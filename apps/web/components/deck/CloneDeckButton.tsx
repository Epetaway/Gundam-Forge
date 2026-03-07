'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cloneDeck } from '@/lib/api/deck-operations';
import { Button } from '@/components/ui/Button';

interface CloneDeckButtonProps {
  deckId: string;
  deckName: string;
  className?: string;
}

export function CloneDeckButton({ deckId, deckName, className }: CloneDeckButtonProps) {
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClone = async () => {
    setIsCloning(true);
    setError(null);

    const result = await cloneDeck(deckId);

    if (result.success && result.deckId) {
      // Redirect to the new deck
      router.push(`/decks/${result.deckId}`);
    } else {
      setError(result.error || 'Failed to clone deck');
      setIsCloning(false);
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleClone}
        disabled={isCloning}
        variant="secondary"
        className="w-full sm:w-auto"
      >
        {isCloning ? 'Cloning...' : `Clone "${deckName}"`}
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
