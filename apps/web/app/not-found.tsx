import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound(): JSX.Element {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-steel-500">404</p>
      <h1 className="font-display text-4xl font-semibold">Route not found</h1>
      <p className="max-w-reading text-sm text-steel-600">
        The UI layer has been rebuilt. This route may no longer exist in the new architecture.
      </p>
      <Button asChild>
        <Link href="/">Return to home</Link>
      </Button>
    </Container>
  );
}
