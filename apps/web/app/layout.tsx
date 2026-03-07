import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gundam Forge',
  description: 'SSR-first Gundam GCG deck-building platform built on a scalable tokenized design system.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html data-theme="dark" lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-sans min-h-svh" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
