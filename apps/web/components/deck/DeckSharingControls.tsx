'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getDeckById, incrementDeckViews, type DeckWithCards } from '@/lib/api/deck-operations';
import { DeckVisibilityToggle } from '@/components/deck/DeckVisibilityToggle';
import { DeckShareCard } from '@/components/deck/DeckShareCard';
import { CloneDeckButton } from '@/components/deck/CloneDeckButton';

interface DeckSharingControlsProps {
  deckId: string;
}

export function DeckSharingControls({ deckId }: DeckSharingControlsProps) {
  const { user } = useAuth();
  const [deck, setDeck] = useState<DeckWithCards | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDeck() {
      const result = await getDeckById(deckId);
      if (result.data) {
        setDeck(result.data);
        // Increment view count
        await incrementDeckViews(deckId);
      }
      setIsLoading(false);
    }

    loadDeck();
  }, [deckId]);

  if (isLoading || !deck) {
    return null;
  }

  const isOwner = user?.id === deck.user_id;

  return (
    <div className="space-y-4 mb-6">
      {isOwner && (
        <div className="rounded-lg border border-border bg-surface-elevated p-4">
          <h3 className="font-semibold text-foreground mb-3">Deck Settings</h3>
          <DeckVisibilityToggle
            deckId={deckId}
            initialIsPublic={deck.is_public}
            onToggle={(isPublic) => {
              // Update local state
              setDeck({ ...deck, is_public: isPublic });
            }}
          />
        </div>
      )}

      {isOwner ? (
        <DeckShareCard
          deckId={deckId}
          deckName={deck.name}
          isPublic={deck.is_public}
        />
      ) : (
        <div className="rounded-lg border border-border bg-surface-elevated p-4">
          <CloneDeckButton deckId={deckId} deckName={deck.name} />
        </div>
      )}
    </div>
  );
}
