export function formatPlacementDeckLabel(deckName: string, archetype: string): string {
  return deckName && deckName !== archetype ? `${deckName} · ${archetype}` : archetype;
}

export function canLinkPlacementDeck(deckId: string, knownDeckIds: Set<string>): boolean {
  if (!deckId || deckId === 'rogue-unclassified') return false;
  return knownDeckIds.has(deckId);
}
