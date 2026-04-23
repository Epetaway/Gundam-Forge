'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CardQuickAddProps {
  cardName: string;
  onAdd: () => void;
  onOpenDetails?: () => void;
  className?: string;
}

/**
 * Mobile quick-add button overlay for deck cards.
 * Shows a large + button for adding 1 copy to deck, with detail access via chevron.
 * Only shown on mobile (sm:hidden) to avoid competing with hover ActionRail on desktop.
 */
export function CardQuickAdd({
  cardName,
  onAdd,
  onOpenDetails,
  className,
}: CardQuickAddProps): JSX.Element {
  return (
    <div
      className={cn(
        'absolute inset-0 sm:hidden flex items-center justify-center z-10',
        'bg-gradient-to-t from-black/60 via-black/30 to-transparent',
        'opacity-0 hover:opacity-100 active:opacity-100 transition-opacity duration-150',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {/* Quick add button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd();
          }}
          aria-label={`Quick add ${cardName} to deck`}
          title="Tap to add (1 copy)"
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            'bg-cobalt-600 text-white font-bold text-lg',
            'active:scale-90 transition-all duration-150',
            'hover:bg-cobalt-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-300',
            'shadow-lg hover:shadow-xl',
          )}
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Detail access hint */}
        {onOpenDetails && (
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm border border-white/10">
            <span className="text-xs text-white font-medium">Details</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDetails();
              }}
              aria-label={`View details for ${cardName}`}
              className="text-white/70 hover:text-white transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
