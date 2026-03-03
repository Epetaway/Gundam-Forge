import type { ParsedDeckEntry } from './parseDeckList';

export interface CardMatchResult {
  matched: Array<{ entry: ParsedDeckEntry; card: any }>;
  ambiguous: Array<{ entry: ParsedDeckEntry; options: any[] }>;
  unmatched: ParsedDeckEntry[];
}

/**
 * Match parsed deck entries against card database.
 * Uses indexed lookups for O(n) performance instead of O(n*m).
 * For large imports, calls onProgress every 50 entries.
 */
export function matchDeckEntries(
  entries: ParsedDeckEntry[],
  cardDb: any[],
  onProgress?: (current: number, total: number) => void,
): CardMatchResult {
  const matched = [], ambiguous = [], unmatched = [];

  // Build index maps for O(1) exact and case-insensitive lookups
  const exactMap = new Map<string, any>();
  const lowerMap = new Map<string, any[]>();

  for (const card of cardDb) {
    // Exact match
    exactMap.set(card.name, card);

    // Case-insensitive (store array to handle duplicates with different cases)
    const lowerKey = card.name.toLowerCase();
    if (!lowerMap.has(lowerKey)) {
      lowerMap.set(lowerKey, []);
    }
    lowerMap.get(lowerKey)!.push(card);
  }

  const total = entries.length;
  const shouldReportProgress = total > 100;
  const progressInterval = 50;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Report progress
    if (shouldReportProgress && i % progressInterval === 0) {
      onProgress?.(i, total);
    }

    // Try: exact match → case-insensitive → substring search
    let matchedCard = exactMap.get(entry.name);

    if (!matchedCard) {
      // Case-insensitive lookup
      const lowerMatches = lowerMap.get(entry.name.toLowerCase());
      if (lowerMatches && lowerMatches.length === 1) {
        matchedCard = lowerMatches[0];
      } else if (lowerMatches && lowerMatches.length > 1) {
        // Multiple case-insensitive matches → ambiguous
        ambiguous.push({ entry, options: lowerMatches });
        continue;
      }
    }

    if (matchedCard) {
      matched.push({ entry, card: matchedCard });
    } else {
      // Last resort: substring search (slower, only for unmatched)
      const substringMatches = cardDb.filter(
        (card) => card.name.toLowerCase().includes(entry.name.toLowerCase())
      );
      if (substringMatches.length === 1) {
        matched.push({ entry, card: substringMatches[0] });
      } else if (substringMatches.length > 1) {
        ambiguous.push({ entry, options: substringMatches });
      } else {
        unmatched.push(entry);
      }
    }
  }

  // Final progress report
  if (shouldReportProgress) {
    onProgress?.(total, total);
  }

  return { matched, ambiguous, unmatched };
}
