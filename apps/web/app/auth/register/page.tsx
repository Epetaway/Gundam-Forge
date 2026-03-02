import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { AuthForm } from '@/components/auth/AuthForm';

export default function RegisterPage(): JSX.Element {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <span className="font-mono text-[11px] uppercase tracking-widest text-cobalt-400">Coming Soon</span>
        <h1 className="font-display text-3xl font-semibold text-foreground">Accounts &amp; Profiles</h1>
        <p className="max-w-sm text-sm text-steel-600">
          User accounts, saved decks, and tournament profiles are in development.
          For now, your decks are saved locally in your browser.
        </p>
        <Link href="/" className="text-sm text-cobalt-300 hover:underline">← Back to home</Link>
      </div>
    );
  }

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="New accounts unlock persistent deck storage and publish controls."
        eyebrow="Authentication"
        title="Create Pilot Account"
      />
      <AuthForm mode="register" />
    </Container>
  );
}
