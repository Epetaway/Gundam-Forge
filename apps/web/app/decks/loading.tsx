import { Container } from '@/components/layout/Container';

export default function DecksLoading(): JSX.Element {
  return (
    <Container className="py-8 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-surface-muted animate-pulse" />
        <div className="h-7 w-40 rounded bg-surface-muted animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-full bg-surface-muted animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>

      {/* Deck card grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-surface-muted overflow-hidden"
            style={{ aspectRatio: '3/4', animationDelay: `${i * 50}ms` }}
          >
            <div className="w-full h-3/4 bg-surface-interactive" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 rounded bg-surface-elevated w-4/5" />
              <div className="h-2.5 rounded bg-surface-elevated w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
