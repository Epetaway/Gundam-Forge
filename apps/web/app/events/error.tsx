'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EventsError({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Error</p>
      <h2 className="font-display text-2xl font-semibold">Events failed to load</h2>
      <p className="max-w-reading text-sm text-text-muted">
        Something went wrong loading tournament data. Check your connection and try again.
      </p>
      <Button onClick={reset}>Retry</Button>
    </Container>
  );
}
