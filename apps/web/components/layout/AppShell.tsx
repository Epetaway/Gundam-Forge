import type { ReactNode } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { MainNav } from '@/components/layout/MainNav';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <WelcomeModal />
      {/* Skip navigation for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-cobalt-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))', paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        <Container className="flex h-16 items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-cobalt-400/70 bg-cobalt-500/25 font-mono text-xs font-bold text-cobalt-300 shadow-[0_0_20px_rgba(59,130,246,0.45),inset_0_0_8px_rgba(59,130,246,0.15)]">
              GF
            </span>
            <span className="font-display text-lg font-semibold uppercase tracking-[0.06em] text-foreground">Gundam Forge</span>
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

      <main id="main-content">{children}</main>

      <footer className="border-t border-border bg-surface/90" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))', paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        <Container className="flex flex-col gap-3 py-6 text-xs text-steel-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for high-velocity Gundam GCG deck iteration.</p>
          <p className="font-mono uppercase tracking-[0.16em]">SSR first • Accessible • Tokenized</p>
        </Container>
      </footer>
    </div>
  );
}
