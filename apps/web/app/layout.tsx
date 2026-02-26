import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gundam Forge',
  description: 'SSR-first Gundam GCG deck-building platform built on a scalable tokenized design system.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return (
    <html data-theme="dark" lang="en">
      <body className="font-sans">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
