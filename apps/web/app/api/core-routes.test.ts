import { describe, expect, it } from 'vitest';
import { GET as getCards } from '@/app/api/cards/route';
import { GET as getDecksRoute } from '@/app/api/decks/route';
import { GET as getDeckAnalyticsSummary } from '@/app/api/deck-analytics/[id]/summary/route';
import { GET as getDeckAnalyticsCards } from '@/app/api/deck-analytics/[id]/cards/route';
import { GET as getDeckAnalyticsComparison } from '@/app/api/deck-analytics/[id]/comparison/route';
import { compareDecksDeterministically } from '@/lib/decks/deterministicSort';

describe('core API routes', () => {
  it('returns filtered cards with deterministic limit handling', async () => {
    const response = await getCards(
      new Request('http://localhost/api/cards?color=Blue&limit=2', { method: 'GET' }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.limit).toBe(2);
    expect(payload.data.cards.length).toBeLessThanOrEqual(2);
    expect(payload.data.total).toBeGreaterThanOrEqual(payload.data.cards.length);
    expect(payload.data.appliedFilters.color).toBe('Blue');
    expect(payload.data.cards.every((card: { color: string }) => card.color === 'Blue')).toBe(true);
  });

  it('returns BAD_REQUEST for invalid cards query params', async () => {
    const response = await getCards(
      new Request('http://localhost/api/cards?limit=1000', { method: 'GET' }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe('BAD_REQUEST');
  });

  it('returns deterministically sorted filtered decks', async () => {
    const response = await getDecksRoute(
      new Request('http://localhost/api/decks?color=Red', { method: 'GET' }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.decks.length).toBeGreaterThan(0);
    expect(
      payload.data.decks.every((deck: { colors: string[] }) => deck.colors.includes('Red')),
    ).toBe(true);

    const actualIds = payload.data.decks.map((deck: { id: string }) => deck.id);
    const expectedIds = [...payload.data.decks]
      .sort(compareDecksDeterministically)
      .map((deck: { id: string }) => deck.id);

    expect(actualIds).toEqual(expectedIds);
  });

  it('returns static fallback deck analytics payloads when supabase is unavailable', async () => {
    const deckId = 'blue-white-midrange';

    const summaryResponse = await getDeckAnalyticsSummary(
      new Request(`http://localhost/api/deck-analytics/${deckId}/summary`, { method: 'GET' }),
      { params: { id: deckId } },
    );
    const cardsResponse = await getDeckAnalyticsCards(
      new Request(`http://localhost/api/deck-analytics/${deckId}/cards`, { method: 'GET' }),
      { params: { id: deckId } },
    );
    const comparisonResponse = await getDeckAnalyticsComparison(
      new Request(`http://localhost/api/deck-analytics/${deckId}/comparison`, { method: 'GET' }),
      { params: { id: deckId } },
    );

    expect(summaryResponse.status).toBe(200);
    expect(cardsResponse.status).toBe(200);
    expect(comparisonResponse.status).toBe(200);

    const summaryPayload = await summaryResponse.json();
    const cardsPayload = await cardsResponse.json();
    const comparisonPayload = await comparisonResponse.json();

    expect(summaryPayload.ok).toBe(true);
    expect(summaryPayload.data.analytics).toBeNull();
    expect(cardsPayload.ok).toBe(true);
    expect(cardsPayload.data.cards).toEqual([]);
    expect(comparisonPayload.ok).toBe(true);
    expect(comparisonPayload.data.comparison).toBeNull();
  });
});