import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDecks, type DeckRecord } from '@/lib/data/decks';

// Force static generation for GitHub Pages
export const dynamic = 'force-static';

interface ComparePageProps {
  searchParams?: {
    ids?: string;
  };
}

function cardTotal(deck: DeckRecord): number {
  return deck.entries.reduce((sum, entry) => sum + entry.qty, 0);
}

function uniqueCards(deck: DeckRecord): number {
  return deck.entries.length;
}

function overlapCount(a: DeckRecord, b: DeckRecord): number {
  const aIds = new Set(a.entries.map((entry) => entry.cardId));
  return b.entries.reduce((sum, entry) => (aIds.has(entry.cardId) ? sum + 1 : sum), 0);
}

export default function DeckComparePage({ searchParams }: ComparePageProps): JSX.Element {
  const allDecks = getDecks();
  const ids = (searchParams?.ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3);

  const selected = ids.length
    ? ids.map((id) => allDecks.find((deck) => deck.id === id)).filter((deck): deck is DeckRecord => Boolean(deck))
    : allDecks.slice(0, 2);

  const [first, second] = selected;
  const overlap = first && second ? overlapCount(first, second) : 0;
  const topDeckOptions = allDecks.slice(0, 20);

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        eyebrow="Deck Analysis"
        title="Compare Decks"
        description="Side-by-side snapshot of deck structure and meta positioning. Pass `?ids=deck-a,deck-b` to compare specific lists."
      />

      <section className="rounded-lg border border-steel-700 bg-surface-900/70 p-4">
        <h2 className="text-sm font-semibold text-surface-foreground">Quick Select</h2>
        <p className="mt-1 text-xs text-steel-400">Use these links to compare popular decks.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {topDeckOptions.slice(0, 6).map((deck, index, arr) => {
            const against = arr[(index + 1) % arr.length];
            return (
              <a
                key={`${deck.id}-${against.id}`}
                href={`/decks/compare?ids=${deck.id},${against.id}`}
                className="min-h-11 rounded border border-steel-700 bg-surface-950 px-3 py-2 text-sm text-surface-foreground transition-colors hover:border-cobalt-500/60"
              >
                {deck.name} vs {against.name}
              </a>
            );
          })}
        </div>
      </section>

      {selected.length === 0 ? (
        <div className="rounded border border-steel-700 bg-surface-900/60 p-4 text-sm text-steel-300">
          No matching deck IDs found.
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {selected.map((deck) => (
            <article key={deck.id} className="rounded-lg border border-steel-700 bg-surface-900/70 p-4">
              <h2 className="text-base font-semibold text-surface-foreground">{deck.name}</h2>
              <p className="mt-1 text-xs text-steel-400">{deck.archetype}</p>
              <p className="mt-3 text-sm text-surface-foreground/90">{deck.description}</p>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-steel-400">Cards</dt>
                  <dd className="font-semibold text-surface-foreground">{cardTotal(deck)}</dd>
                </div>
                <div>
                  <dt className="text-steel-400">Unique</dt>
                  <dd className="font-semibold text-surface-foreground">{uniqueCards(deck)}</dd>
                </div>
                <div>
                  <dt className="text-steel-400">Likes</dt>
                  <dd className="font-semibold text-surface-foreground">{deck.likes}</dd>
                </div>
                <div>
                  <dt className="text-steel-400">Views</dt>
                  <dd className="font-semibold text-surface-foreground">{deck.views}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      )}

      {first && second && (
        <section className="rounded-lg border border-cobalt-700/40 bg-cobalt-900/20 p-4">
          <h3 className="text-sm font-semibold text-cobalt-300">Comparison Summary</h3>
          <p className="mt-2 text-sm text-surface-foreground/90">
            {first.name} and {second.name} share {overlap} unique cards.
          </p>
        </section>
      )}
    </Container>
  );
}
