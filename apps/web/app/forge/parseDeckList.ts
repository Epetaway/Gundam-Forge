// Robust decklist parser for paste-to-import
export interface ParsedDeckEntry {
  qty: number;
  name: string;
  setId?: string;
  originalLine: string;
}

export function parseDeckList(text: string): ParsedDeckEntry[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      let qty = 1;
      let name = line;
      let setId;
      let match;
      // Patterns: "3 Sinanju", "Sinanju x3", "Sinanju (3)", "ST03-001 Sinanju x3"
      if ((match = line.match(/^(\d+)\s+(.+)$/))) {
        qty = parseInt(match[1], 10);
        name = match[2];
      } else if ((match = line.match(/^(.+)\s+x(\d+)$/i))) {
        name = match[1];
        qty = parseInt(match[2], 10);
      } else if ((match = line.match(/^(.+)\s+\((\d+)\)$/))) {
        name = match[1];
        qty = parseInt(match[2], 10);
      }
      // Optional: "ST03-001 Sinanju x3"
      if ((match = name.match(/^(\w+-\d+)\s+(.+)$/))) {
        setId = match[1];
        name = match[2];
      }
      name = name.replace(/^[-*•]+/, '').trim();
      return { qty, name, setId, originalLine: line };
    });
}
