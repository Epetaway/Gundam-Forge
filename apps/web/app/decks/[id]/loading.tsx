import { Container } from '@/components/layout/Container';

export default function DeckDetailLoading(): JSX.Element {
  return (
    <Container className="space-y-6 py-6" wide>
      <div className="h-28 animate-pulse rounded-lg border border-border bg-surface-muted" />
      <div className="h-16 animate-pulse rounded-lg border border-border bg-surface-muted" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[560px] animate-pulse rounded-lg border border-border bg-surface-muted" />
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-lg border border-border bg-surface-muted" />
          <div className="h-80 animate-pulse rounded-lg border border-border bg-surface-muted" />
        </div>
      </div>
    </Container>
  );
}
