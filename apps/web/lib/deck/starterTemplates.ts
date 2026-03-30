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
const MAIN_DECK_TARGET = 50;
const MAX_COPIES_PER_CARD = 4;

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

function normalizeMainDeckCount(
  entries: Array<{ cardId: string; qty: number; isBoss?: boolean }>,
): Array<{ cardId: string; qty: number; isBoss?: boolean }> {
  const normalized = entries
    .map((entry) => ({ ...entry, qty: Math.max(1, Math.floor(entry.qty || 0)) }))
    .filter((entry) => entry.qty > 0);

  if (normalized.length === 0) return normalized;

  const total = () => normalized.reduce((sum, entry) => sum + entry.qty, 0);
  let current = total();

  if (current < MAIN_DECK_TARGET) {
    let adjusted = true;
    while (current < MAIN_DECK_TARGET && adjusted) {
      adjusted = false;
      for (const entry of normalized) {
        if (current >= MAIN_DECK_TARGET) break;
        if (entry.qty >= MAX_COPIES_PER_CARD) continue;
        entry.qty += 1;
        current += 1;
        adjusted = true;
      }
    }

    // If source data is too sparse, continue filling to keep starter decks playable.
    while (current < MAIN_DECK_TARGET) {
      for (const entry of normalized) {
        if (current >= MAIN_DECK_TARGET) break;
        entry.qty += 1;
        current += 1;
      }
    }
  } else if (current > MAIN_DECK_TARGET) {
    while (current > MAIN_DECK_TARGET) {
      let adjusted = false;
      for (const entry of normalized) {
        if (current <= MAIN_DECK_TARGET) break;
        if (entry.qty <= 1) continue;
        entry.qty -= 1;
        current -= 1;
        adjusted = true;
      }
      if (!adjusted) break;
    }
  }

  return normalized;
}

export function getStarterDeckTemplates(limit = 6): StarterDeckTemplate[] {
  return OFFICIAL_DECKS
    .map((deck) => {
      const entries = normalizeMainDeckCount(
        deck.cards
        .map((card) => ({ cardId: card.cardId, qty: card.qty, isBoss: card.isBoss }))
        .filter((card) => cardsById.has(card.cardId)),
      );

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
