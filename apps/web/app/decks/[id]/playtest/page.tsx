import { deckCatalog } from '@/lib/data/decks';
import { notFound } from 'next/navigation';

// Always generate static params so Next.js export doesn't reject the dynamic route.
// The page body calls notFound() in production to keep the route inaccessible.
export function generateStaticParams() {
  return deckCatalog.map((deck) => ({ id: deck.id }));
}

export default function PlaytestPage() {
  notFound();
}
