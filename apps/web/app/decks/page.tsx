import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDecks } from '@/lib/data/decks';
import DecksClient from '@/app/decks/DecksClient';

export default function DecksPage(): JSX.Element {
  const initialDecks = getDecks();

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Curated and community-style lists represented in a stable schema for SSR rendering and API portability."
        eyebrow="Deck Archive"
        title="Deck Library"
      />

      <DecksClient initialDecks={initialDecks} />
    </Container>
  );
}
