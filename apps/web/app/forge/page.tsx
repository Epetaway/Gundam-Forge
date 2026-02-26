import type { Metadata } from 'next';
import { ForgeWorkbench } from '@/app/forge/forge-workbench';

export const metadata: Metadata = {
  title: 'Forge · Gundam Forge',
  description: 'Build, tune, and validate your Gundam Card Game deck.',
};

/**
 * Forge page — search-first deck builder.
 *
 * No card data is loaded at server-render time. The client-side
 * ForgeWorkbench fetches cards on-demand via /api/cards/search
 * only after the user types a query or applies a filter.
 */
export default function ForgePage(): JSX.Element {
  return (
    // Full viewport height minus the 4rem (64px) sticky header
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <ForgeWorkbench />
    </div>
  );
}
