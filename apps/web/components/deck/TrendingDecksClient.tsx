"use client";
import { DeckPreviewCard } from "./DeckPreviewCard";
import { useRouter } from "next/navigation";

export interface TrendingDeckData {
  id: string;
  heroUrl: string;
  title: string;
  subtitle: string;
  author: string;
  views: number;
  cardCount: number;
  updatedAgo: string;
  colors: string[];
  tags?: string[];
  avatarUrl?: string;
}

export function TrendingDecksClient({ decks }: { decks: TrendingDeckData[] }) {
  const router = useRouter();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckPreviewCard
          key={deck.id}
          {...deck}
          onClick={() => router.push(`/decks/${deck.id}`)}
          onMenu={() => {}}
        />
      ))}
    </div>
  );
}
