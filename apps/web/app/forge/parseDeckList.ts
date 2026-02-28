// Robust decklist parser for paste-to-import
export interface ParsedDeckEntry {
  qty: number;
  name: string;
  setId?: string;
  originalLine: string;
}

/** Maximum sensible quantity per line — catches typos like "400 Gundam". */
const MAX_QTY = 50;

export function parseDeckList(text: string): ParsedDeckEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    // Skip blanks and comment lines (# or //)
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'))
    .map((line) => {
      let qty = 1;
      let name = line;
      let setId: string | undefined;
      let match: RegExpMatchArray | null;

      // Patterns: "x3 Sinanju", "3x Sinanju", "3 Sinanju", "Sinanju x3", "Sinanju (3)", "ST03-001 Sinanju x3"
      if ((match = line.match(/^x(\d+)\s+(.+)$/i))) {
        // "x3 Sinanju" — x-prefix quantity
        qty = parseInt(match[1], 10);
        name = match[2];
      } else if ((match = line.match(/^(\d+)x\s+(.+)$/i))) {
        // "3x Sinanju" — digit+x prefix
        qty = parseInt(match[1], 10);
        name = match[2];
      } else if ((match = line.match(/^(\d+)\s+(.+)$/))) {
        qty = parseInt(match[1], 10);
        name = match[2];
      } else if ((match = line.match(/^(.+)\s+x(\d+)$/i))) {
        name = match[1];
        qty = parseInt(match[2], 10);
      } else if ((match = line.match(/^(.+)\s+\((\d+)\)$/))) {
        name = match[1];
        qty = parseInt(match[2], 10);
      }

      // Clamp quantity to a sane range
      qty = Math.max(1, Math.min(qty, MAX_QTY));

      // Optional: extract card-ID prefix "ST03-001 Sinanju x3"
      if ((match = name.match(/^(\w{2,6}-\d+)\s+(.+)$/))) {
        setId = match[1];
        name = match[2];
      }

      // Strip leading bullet/dash markers
      name = name.replace(/^[-*•]+\s*/, '').trim();

      // Strip trailing parenthetical set info added by exporters, e.g. "Gundam (ST01-001)"
      name = name.replace(/\s*\([A-Z]{2,6}-\d+\)$/, '').trim();

      return { qty, name, setId, originalLine: line };
    })
    .filter((entry) => entry.name.length > 0);
}
