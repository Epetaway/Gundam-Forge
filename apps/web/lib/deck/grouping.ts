import type { DeckViewItem } from '@/lib/deck/sortFilter';

export interface DeckTypeStack {
  id: string;
  label: string;
  totalQty: number;
  cards: DeckViewItem[];
}

export function groupDeckItemsByType(items: DeckViewItem[]): DeckTypeStack[] {
  const buckets = new Map<string, DeckTypeStack>();

  for (const item of items) {
    const label = item.typeLine || 'Other';
    const existing = buckets.get(label);
    if (existing) {
      existing.cards.push(item);
      existing.totalQty += item.qty;
      continue;
    }

    buckets.set(label, {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      totalQty: item.qty,
      cards: [item],
    });
  }

  return Array.from(buckets.values()).sort((a, b) => {
    const qtyDelta = b.totalQty - a.totalQty;
    if (qtyDelta !== 0) return qtyDelta;
    return a.label.localeCompare(b.label);
  });
}
