import type { CardColor } from '@gundam-forge/shared';
import { OFFICIAL_DECKS } from '@/lib/data/officialDecks';
import { cardsById, getCardImage } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';

export interface StarterDeckTemplate {
  slug: string;
  name: string;
  description: string;
  archetype: string;
  colors: CardColor[];
  imageUrl: string;
  sourceUrl: string;
  entries: Array<{ cardId: string; qty: number }>;
}

const VALID_COLORS = new Set<CardColor>(['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless']);

function toDisplayName(slug: string, name: string): string {
  const normalizedName = name.trim();
  if (normalizedName.length > 0 && !/^deck-\d+$/i.test(normalizedName)) {
    return normalizedName;
  }

  const match = slug.match(/deck-(\d+)/i);
  if (match) {
    return `Official Starter Deck ${match[1]}`;
  }

  return normalizedName.length > 0 ? normalizedName : 'Official Starter Deck';
}

function normalizeColors(raw: string[], entries: Array<{ cardId: string; qty: number }>): CardColor[] {
  const fromDeck = raw.filter((color): color is CardColor => VALID_COLORS.has(color as CardColor));

  if (fromDeck.length > 0) {
    return [...new Set(fromDeck)];
  }

  const inferred = entries
    .map((entry) => cardsById.get(entry.cardId)?.color)
    .filter((color): color is CardColor => Boolean(color) && color !== 'Colorless');

  return [...new Set(inferred)];
}

function resolveTemplateImage(
  deckImageUrl: string | undefined,
  entries: Array<{ cardId: string; qty: number; isBoss?: boolean }>,
): string {
  if (deckImageUrl && deckImageUrl.trim().length > 0) {
    if (deckImageUrl.startsWith('/')) {
      return withBasePath(deckImageUrl);
    }
    return deckImageUrl;
  }

  const bossCard = entries.find((entry) => entry.isBoss && cardsById.has(entry.cardId));
  if (bossCard) {
    const card = cardsById.get(bossCard.cardId);
    if (card) return getCardImage(card);
  }

  const firstCard = entries.find((entry) => cardsById.has(entry.cardId));
  if (firstCard) {
    const card = cardsById.get(firstCard.cardId);
    if (card) return getCardImage(card);
  }

  return withBasePath('/hero-bg.png');
}

export function getStarterDeckTemplates(limit = 6): StarterDeckTemplate[] {
  return OFFICIAL_DECKS
    .map((deck) => {
      const entries = deck.cards
        .map((card) => ({ cardId: card.cardId, qty: card.qty, isBoss: card.isBoss }))
        .filter((card) => cardsById.has(card.cardId));

      if (entries.length === 0) return null;

      return {
        slug: deck.slug,
        name: toDisplayName(deck.slug, deck.name),
        description: deck.description.trim() || `Start from ${deck.archetype.trim() || 'an official list'} and tune in Forge.`,
        archetype: deck.archetype.trim() || 'Starter',
        colors: normalizeColors(deck.colors, entries),
        imageUrl: resolveTemplateImage(deck.imageUrl, entries),
        sourceUrl: deck.sourceUrl,
        entries: entries.map((entry) => ({ cardId: entry.cardId, qty: entry.qty })),
      } satisfies StarterDeckTemplate;
    })
    .filter((deck): deck is StarterDeckTemplate => Boolean(deck))
    .slice(0, limit);
}
