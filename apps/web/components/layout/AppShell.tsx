import type { ReactNode } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { MainNav } from '@/components/layout/MainNav';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cobalt-500/30 bg-cobalt-500/10 font-mono text-xs font-bold text-cobalt-600">
              GF
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Gundam Forge</span>
          </Link>
          <div className="flex items-center gap-3">
            <MainNav />
            <ThemeToggle />
            <Button asChild className="hidden md:inline-flex" size="sm" variant="secondary">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </Container>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border bg-surface">
        <Container className="flex flex-col gap-3 py-6 text-xs text-steel-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for high-velocity Gundam GCG deck iteration.</p>
          <p className="font-mono uppercase tracking-[0.16em]">SSR first • Accessible • Tokenized</p>
        </Container>
      </footer>
    </div>
  );
}
