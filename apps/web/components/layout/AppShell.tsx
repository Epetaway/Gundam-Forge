import type { ReactNode } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { MainNav } from '@/components/layout/MainNav';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserMenu } from '@/components/layout/UserMenu';
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

      <header className="safe-pad-top safe-pad-x sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-cobalt-400/70 bg-cobalt-500/25 font-mono text-xs font-bold text-cobalt-300 shadow-[0_0_20px_rgba(59,130,246,0.45),inset_0_0_8px_rgba(59,130,246,0.15)]">
              GF
            </span>
            <span className="font-display text-lg font-semibold uppercase tracking-[0.06em] text-foreground">Gundam Forge</span>
          </Link>
          <div className="flex items-center gap-4">
            <MainNav />
            <ThemeToggle />
            <UserMenu />
          </div>
        </Container>
      </header>

      <main id="main-content">{children}</main>

      <footer className="safe-pad-x safe-pad-bottom border-t border-border bg-surface/90">
        <Container className="flex flex-col gap-4 py-6 text-xs text-steel-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for high-velocity Gundam GCG deck iteration.</p>
          <p className="font-mono uppercase tracking-[0.16em]">Fast · Free · Community-powered</p>
        </Container>
      </footer>
    </div>
  );
}
