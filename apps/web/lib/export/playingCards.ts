import type { DeckRecord } from '@/lib/data/decks';

export interface PlayingCardsExportCard {
  id: string;
  name: string;
  qty: number;
  imageUrl: string;
  text: string;
  type: string;
  color: string;
  cost: number;
  ap: number;
  hp: number;
}

export interface PlayingCardsDeckExport {
  format: 'playingcardsio-v1';
  exportedAt: string;
  deck: {
    id: string;
    name: string;
    archetype: string;
    colors: string[];
    cards: PlayingCardsExportCard[];
  };
}

export function buildPlayingCardsDeckExport(
  deck: DeckRecord,
  cardDatabase: Record<string, any>,
): PlayingCardsDeckExport {
  const cards: PlayingCardsExportCard[] = deck.entries
    .map((entry) => {
      const card = cardDatabase[entry.cardId];
      if (!card) return null;

      return {
        id: card.id,
        name: card.name ?? entry.cardId,
        qty: entry.qty,
        imageUrl: card.imageUrl ?? '',
        text: card.text ?? '',
        type: card.type ?? 'Unknown',
        color: card.color ?? 'Colorless',
        cost: Number(card.cost ?? 0),
        ap: Number(card.ap ?? 0),
        hp: Number(card.hp ?? 0),
      };
    })
    .filter((card): card is PlayingCardsExportCard => Boolean(card));

  return {
    format: 'playingcardsio-v1',
    exportedAt: new Date().toISOString(),
    deck: {
      id: deck.id,
      name: deck.name,
      archetype: deck.archetype,
      colors: deck.colors,
      cards,
    },
  };
}

export function downloadPlayingCardsDeckExport(
  deck: DeckRecord,
  cardDatabase: Record<string, any>,
): void {
  const payload = buildPlayingCardsDeckExport(deck, cardDatabase);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${deck.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-playingcards.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
