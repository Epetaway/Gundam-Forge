import { Container } from '@/components/layout/Container';

export default function EventsLoading(): JSX.Element {
  return (
    <Container className="space-y-8 py-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-surface-muted animate-pulse" />
        <div className="h-7 w-56 rounded bg-surface-muted animate-pulse" />
      </div>

      {/* Event list skeleton */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-surface-elevated overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Event header bar */}
              <div className="h-8 bg-surface-interactive" />
              {/* Title area */}
              <div className="space-y-4 p-4">
                <div className="h-5 w-3/5 rounded bg-surface-muted" />
                {/* Placement rows */}
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-12 rounded-md bg-surface-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar skeleton */}
        <div className="animate-pulse rounded-xl border border-border bg-surface-elevated h-64" />
      </div>
    </Container>
  );
}
