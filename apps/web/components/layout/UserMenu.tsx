'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { isFeatureEnabled } from '@/lib/config/features';

export function UserMenu(): JSX.Element {
  const authEnabled = isFeatureEnabled('authEnabled');
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!authEnabled) {
    return <></>;
  }

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-steel-200" />
    );
  }

  if (!user) {
    return (
      <Button asChild className="hidden md:inline-flex" size="sm" variant="secondary">
        <Link href="/auth/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-cobalt-500/25 text-sm font-semibold text-cobalt-300 hover:bg-cobalt-500/35 focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {user.email?.[0]?.toUpperCase() ?? 'U'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-surface shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
            </div>

            <div className="py-1">
              <Link
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
                href="/profile"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              <Link
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
                href="/decks"
                onClick={() => setIsOpen(false)}
              >
                My Decks
              </Link>
              <Link
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
                href="/profile/security"
                onClick={() => setIsOpen(false)}
              >
                Security
              </Link>
            </div>

            <div className="border-t border-border py-1">
              <button
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-surface-hover"
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
