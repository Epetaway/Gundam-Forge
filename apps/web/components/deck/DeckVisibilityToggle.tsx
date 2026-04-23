'use client';

import { useState } from 'react';
import { toggleDeckVisibility } from '@/lib/api/deck-operations';

interface DeckVisibilityToggleProps {
  deckId: string;
  initialIsPublic: boolean;
  onToggle?: (isPublic: boolean) => void;
}

export function DeckVisibilityToggle({ deckId, initialIsPublic, onToggle }: DeckVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);

    const result = await toggleDeckVisibility(deckId);

    if (result.success && result.isPublic !== undefined) {
      setIsPublic(result.isPublic);
      onToggle?.(result.isPublic);
    } else {
      setError(result.error || 'Failed to toggle visibility');
      // Revert optimistic update after a delay
      setTimeout(() => setError(null), 3000);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cobalt-400 focus:ring-offset-2 disabled:opacity-50"
        style={{ backgroundColor: isPublic ? '#3b82f6' : '#64748b' }}
        aria-label={isPublic ? 'Make deck private' : 'Make deck public'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            isPublic ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {isPublic ? 'Public' : 'Private'}
        </span>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
