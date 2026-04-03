import { Container } from '@/components/layout/Container';

export function CardsSkeleton(): JSX.Element {
  return (
    <Container className="py-8 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-surface-muted animate-pulse" />
        <div className="h-7 w-48 rounded bg-surface-muted animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-full bg-surface-muted animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>

      {/* Card grid skeleton — 12 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-surface-muted overflow-hidden"
            style={{ aspectRatio: '3/4', animationDelay: `${i * 40}ms` }}
          >
            {/* Image placeholder */}
            <div className="w-full h-3/4 bg-surface-interactive" />
            {/* Text placeholders */}
            <div className="p-2 space-y-1.5">
              <div className="h-3 rounded bg-surface-elevated w-4/5" />
              <div className="h-2.5 rounded bg-surface-elevated w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
