import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { getDecks } from '@/lib/data/decks';
import { ProfilePanel } from '@/app/profile/profile-panel';

export default function ProfilePage(): JSX.Element {
  if (process.env.NODE_ENV === 'production') {
    return (
      <Container className="space-y-6 py-8">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-steel-500">Coming Soon</p>
          <h1 className="text-3xl font-semibold text-foreground">Accounts & Profiles</h1>
          <p className="max-w-sm text-sm text-steel-600">
            User accounts, saved decks, and tournament profiles are in development.
            For now, your decks are saved locally in your browser.
          </p>
          <Link href="/" className="text-sm text-cobalt-500 hover:text-cobalt-400 transition-colors">
            ← Back to home
          </Link>
        </div>
      </Container>
    );
  }

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
