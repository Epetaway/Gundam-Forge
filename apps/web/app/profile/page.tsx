import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDecks } from '@/lib/data/decks';
import { ProfilePanel } from '@/app/profile/profile-panel';

export default function ProfilePage(): JSX.Element {
  const decks = getDecks();

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="User-facing account surface with reusable tabs, cards, and action controls."
        eyebrow="Account"
        title="Pilot Profile"
      />
      <ProfilePanel decks={decks.map((deck) => ({
        id: deck.id,
        name: deck.name,
        likes: deck.likes,
        views: deck.views,
        archetype: deck.archetype,
      }))} />
    </Container>
  );
}
