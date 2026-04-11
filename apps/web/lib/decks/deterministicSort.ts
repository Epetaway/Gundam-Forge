import type { DeckRecord } from '@/lib/data/decks';

function scoreDeck(deck: DeckRecord): number {
  return deck.likes + deck.views;
}

export function compareDecksDeterministically(a: DeckRecord, b: DeckRecord): number {
  const byScore = scoreDeck(b) - scoreDeck(a);
  if (byScore !== 0) return byScore;

  const byLikes = b.likes - a.likes;
  if (byLikes !== 0) return byLikes;

  const byViews = b.views - a.views;
  if (byViews !== 0) return byViews;

  const aUpdatedAt = Date.parse(a.updatedAt ?? '1970-01-01T00:00:00Z');
  const bUpdatedAt = Date.parse(b.updatedAt ?? '1970-01-01T00:00:00Z');
  const byUpdatedAt = bUpdatedAt - aUpdatedAt;
  if (byUpdatedAt !== 0) return byUpdatedAt;

  const byName = a.name.localeCompare(b.name);
  if (byName !== 0) return byName;

  return a.id.localeCompare(b.id);
}