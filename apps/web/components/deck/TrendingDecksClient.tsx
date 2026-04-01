import Link from "next/link";
import { Layers } from "lucide-react";
import { DeckPreviewCard } from "./DeckPreviewCard";
import { Button } from "@/components/ui/Button";

export interface TrendingDeckData {
  id: string;
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
}

export function TrendingDecksClient({ decks }: { decks: TrendingDeckData[] }) {
  if (decks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-muted/50 py-12 text-center">
        <Layers className="mx-auto mb-3 h-8 w-8 text-steel-600" aria-hidden="true" />
        <p className="font-mono text-xs uppercase tracking-widest text-steel-500 mb-3">No trending decks yet</p>
        <p className="text-sm text-steel-600 mb-4">Be the first to build a deck and contribute to the meta.</p>
        <Link href="/forge">
          <Button size="sm" variant="primary">+ Create Deck</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckPreviewCard
          key={deck.id}
          {...deck}
          href={`/decks/${deck.id}`}
        />
      ))}
    </div>
  );
}
