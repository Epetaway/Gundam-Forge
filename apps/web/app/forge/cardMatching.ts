import type { ParsedDeckEntry } from './parseDeckList';

export interface CardMatchResult {
  matched: Array<{ entry: ParsedDeckEntry; card: any }>;
  ambiguous: Array<{ entry: ParsedDeckEntry; options: any[] }>;
  unmatched: ParsedDeckEntry[];
}

export function matchDeckEntries(entries: ParsedDeckEntry[], cardDb: any[]): CardMatchResult {
  const matched = [], ambiguous = [], unmatched = [];
  for (const entry of entries) {
    // Try exact, case-insensitive, contains
    const matches = cardDb.filter(card =>
      card.name === entry.name ||
      card.name.toLowerCase() === entry.name.toLowerCase() ||
      card.name.toLowerCase().includes(entry.name.toLowerCase())
    );
    if (matches.length === 1) matched.push({ entry, card: matches[0] });
    else if (matches.length > 1) ambiguous.push({ entry, options: matches });
    else unmatched.push(entry);
  }
  return { matched, ambiguous, unmatched };
}
