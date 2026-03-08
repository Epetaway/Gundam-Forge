'use client';

/**
 * Effect Keyword Pills
 * 
 * Clickable effect badges for quick filtering.
 * Shows popular effects or selected effects with counts.
 */

import type { Suggestion } from '@/lib/search/searchSuggestions';
import { CATEGORY_LABELS, type EffectCategory } from '@/lib/search/effectKeywordDatabase';

export interface EffectKeywordPillsProps {
  /** Effect suggestions to display as pills */
  effects: Suggestion[];
  /** Currently active effect keywords */
  activeEffects?: string[];
  /** Callback when effect is clicked */
  onEffectClick: (effect: string) => void;
  /** Maximum pills to show before "more" button */
  maxVisible?: number;
  /** Whether to show category labels */
  showCategories?: boolean;
}

export function EffectKeywordPills({
  effects,
  activeEffects = [],
  onEffectClick,
  maxVisible = 12,
  showCategories = false,
}: EffectKeywordPillsProps) {
  if (effects.length === 0) {
    return null;
  }

  // Group effects by category if requested
  const groupedEffects = showCategories
    ? groupByCategory(effects)
    : [{ category: null, effects }];

  return (
    <div className="space-y-3">
      {groupedEffects.map((group, groupIndex) => (
        <div key={`category-${groupIndex}`}>
          {group.category && (
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {CATEGORY_LABELS[group.category]}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {group.effects.slice(0, maxVisible).map((effect) => {
              const isActive = activeEffects.includes(effect.value);

              return (
                <button
                  key={effect.value}
                  type="button"
                  onClick={() => onEffectClick(effect.value)}
                  className={`
                    flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-cobalt-600 text-white ring-2 ring-cobalt-400'
                        : 'bg-surface-interactive text-text-secondary hover:bg-surface-muted'
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <span>{effect.label}</span>
                  {effect.count !== undefined && (
                    <span
                      className={`
                        text-xs px-1.5 py-0.5 rounded
                        ${isActive ? 'bg-cobalt-700' : 'bg-surface text-text-muted'}
                      `}
                    >
                      {effect.count}
                    </span>
                  )}
                </button>
              );
            })}

            {group.effects.length > maxVisible && (
              <button
                type="button"
                className="rounded-full bg-surface-interactive px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-muted"
                aria-label={`${group.effects.length - maxVisible} more effects`}
              >
                +{group.effects.length - maxVisible} more
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface GroupedEffects {
  category: EffectCategory | null;
  effects: Suggestion[];
}

function groupByCategory(effects: Suggestion[]): GroupedEffects[] {
  const groups = new Map<EffectCategory | null, Suggestion[]>();

  for (const effect of effects) {
    const category = effect.category ?? null;
    const existing = groups.get(category) ?? [];
    existing.push(effect);
    groups.set(category, existing);
  }

  return Array.from(groups.entries()).map(([category, effects]) => ({
    category,
    effects,
  }));
}

/**
 * Simple pill display without interaction (for read-only views)
 */
export function EffectKeywordBadges({ effects }: { effects: string[] }) {
  if (effects.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {effects.map((effect) => (
        <span
          key={effect}
          className="rounded bg-surface-interactive px-2 py-1 text-xs font-medium text-text-secondary"
        >
          {effect.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  );
}
