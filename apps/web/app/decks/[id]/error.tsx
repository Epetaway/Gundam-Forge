'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DeckDetailError({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-6 text-center" wide>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Error</p>
      <h2 className="font-display text-2xl font-semibold">Deck failed to load</h2>
      <p className="max-w-reading text-sm text-text-muted">
        Something went wrong while loading deck details. Try again.
      </p>
      <Button onClick={reset} variant="secondary">Retry</Button>
    </Container>
  );
}
