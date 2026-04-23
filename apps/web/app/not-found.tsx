import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound(): JSX.Element {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">404</p>
      <h1 className="font-display text-4xl font-semibold">Route not found</h1>
      <p className="max-w-reading text-sm text-text-muted">
        That page does not exist. It may have moved or the link may be broken.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/">Return to home</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/decks">Browse Decks</Link>
        </Button>
      </div>
    </Container>
  );
}
