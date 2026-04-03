import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDecks } from '@/lib/data/decks';
import { getEvents } from '@/lib/data/events';
import DecksClient from '@/app/decks/DecksClient';

export default function DecksPage(): JSX.Element {
  const initialDecks = getDecks();
  const events = getEvents();

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Browse the full deck ecosystem with trend momentum, win rate, and community activity in one place."
        eyebrow="Browse"
        title="Deck Browser"
      />

      <DecksClient initialDecks={initialDecks} events={events} />
    </Container>
  );
}
