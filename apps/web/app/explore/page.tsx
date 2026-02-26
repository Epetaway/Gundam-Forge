import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import ExploreClient from '@/app/explore/ExploreClient';
import { getDecks } from '@/lib/data/decks';

export default function ExplorePage(): JSX.Element {
  const decks = getDecks();

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Track the live ladder with trend momentum, event pressure, and win-rate intelligence."
        eyebrow="Explore"
        title="Deck Explorer"
      />
      <ExploreClient initialDecks={decks} />
    </Container>
  );
}
