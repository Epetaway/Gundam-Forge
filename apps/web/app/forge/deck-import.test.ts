import { describe, it, expect } from 'vitest';

// Sample card DB
const cards = [
  { id: 'gundam', name: 'Gundam', type: 'Unit' },
  { id: 'zaku-ii', name: 'Zaku II', type: 'Unit' },
  { id: 'ex-foo', name: 'EX Foo', type: 'EX' },
  { id: 'ex-base', name: 'EX Base', type: 'EX Base' },
  { id: 'resource', name: 'Resource Card', type: 'Resource' },
];

function parseDeckImport(input: string, cardDb: { id: string; name: string; type: string }[]) {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const nameToId = Object.fromEntries(cardDb.map(c => [c.name.toLowerCase(), c.id]));
  const excludedTypes = ['EX', 'EX Base', 'Resource'];
  const deck: Record<string, number> = {};
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (!match) throw new Error(`Invalid line: ${line}`);
    const name = match[2].toLowerCase();
    const card = cardDb.find(c => c.name.toLowerCase() === name);
    if (!card) throw new Error(`Card not found: ${match[2]}`);
    if (excludedTypes.includes(card.type)) continue;
    deck[card.id] = (deck[card.id] || 0) + parseInt(match[1], 10);
  }
  return deck;
}

describe('Deck import parsing', () => {
  it('parses valid deck list and excludes EX/EX Base/Resource', () => {
    const input = `4 Gundam\n2 Zaku II\n1 EX Foo\n1 EX Base\n1 Resource Card`;
    const deck = parseDeckImport(input, cards);
    expect(deck).toEqual({ gundam: 4, 'zaku-ii': 2 });
  });

  it('throws on invalid line', () => {
    expect(() => parseDeckImport('bad line', cards)).toThrow();
  });

  it('throws on missing card', () => {
    expect(() => parseDeckImport('1 NotARealCard', cards)).toThrow();
  });
});
