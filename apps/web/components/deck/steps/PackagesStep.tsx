'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getAllPackages, getPackageSupportLevel } from '@gundam-forge/shared';
import type { CardColor } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';

interface PackagesStepProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  packages: string[];
  onPackagesChange: (packages: string[]) => void;
  onBack?: () => void;
  
  /** Selected colors from Step 2 - used to filter/annotate packages */
  selectedColors?: CardColor[];
  
  /** Selected clans from Step 1 - future use for faction-specific filtering */
  selectedClans?: string[];
}

export default function PackagesStep({
  expanded,
  onExpandChange,
  packages,
  onPackagesChange,
  onBack,
  selectedColors = [],
  selectedClans = [],
}: PackagesStepProps) {
  const allPackages = getAllPackages();
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

  const handleTogglePackage = (packageId: string) => {
    const newPackages = packages.includes(packageId)
      ? packages.filter((p) => p !== packageId)
      : [...packages, packageId];
    onPackagesChange(newPackages);
  };

  // Sort packages by support level (strong -> moderate -> limited -> none)
  const sortedPackages = [...allPackages].sort((a, b) => {
    const supportOrder = { strong: 0, moderate: 1, limited: 2, none: 3 };
    const aSupport = getPackageSupportLevel(a, selectedColors);
    const bSupport = getPackageSupportLevel(b, selectedColors);
    return supportOrder[aSupport] - supportOrder[bSupport];
  });

  // Get support indicator component
  const getSupportBadge = (supportLevel: 'strong' | 'moderate' | 'limited' | 'none') => {
    switch (supportLevel) {
      case 'strong':
        return (
          <span className="text-[10px] font-semibold text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded border border-green-500/30">
            Strong
          </span>
        );
      case 'moderate':
        return (
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-500/30">
            Good
          </span>
        );
      case 'limited':
        return (
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-500/30">
            Limited
          </span>
        );
      case 'none':
        return (
          <span className="text-[10px] font-semibold text-steel-600 bg-steel-900/30 px-1.5 py-0.5 rounded border border-steel-700/30">
            Unavailable
          </span>
        );
    }
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => onExpandChange(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cobalt-400 bg-cobalt-900/40 px-2 py-0.5 rounded">
            Step 3
          </span>
          <span className="font-semibold text-sm text-foreground">Play Style</span>
          <span className="text-xs text-steel-600">(optional)</span>
          {packages.length > 0 && (
            <span className="text-xs text-green-400">
              {packages.length} selected
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-steel-600 transition-transform',
            expanded ? 'rotate-180' : '',
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-border bg-surface-interactive/50 flex flex-col gap-3">
          <div className="rounded-md border border-cobalt-700/30 bg-cobalt-900/20 px-2 py-2 text-xs text-cobalt-300">
            ℹ️ Play styles guide card suggestions in the Forge. You can always change this later.
          </div>

          <p className="text-xs text-steel-600">
            Choose the strategies your deck will focus on. This helps the Forge suggest the right cards for your build.
            {selectedColors.length > 0 && (
              <span className="block mt-1 text-steel-500">
                Packages sorted by card availability in your selected colors.
              </span>
            )}
          </p>

          <div className="space-y-2">
            {sortedPackages.map((pkg) => {
              const selected = packages.includes(pkg.id);
              const pkgExpanded = expandedPackage === pkg.id;
              const supportLevel = getPackageSupportLevel(pkg, selectedColors);
              const isUnavailable = supportLevel === 'none' && selectedColors.length > 0;

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    'rounded-lg border transition-all',
                    selected
                      ? 'border-cobalt-500 bg-cobalt-900/20'
                      : 'border-border bg-surface-interactive hover:bg-surface',
                    isUnavailable && 'opacity-50',
                  )}
                >
                  {/* Package Header / Checkbox Row */}
                  <div className="flex items-start gap-2.5 px-3 py-2">
                    <input
                      type="checkbox"
                      id={`pkg-${pkg.id}`}
                      checked={selected}
                      onChange={() => handleTogglePackage(pkg.id)}
                      disabled={isUnavailable}
                      className={cn(
                        'w-4 h-4 mt-0.5 rounded border border-border bg-surface-interactive',
                        isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer',
                      )}
                    />
                    <label htmlFor={`pkg-${pkg.id}`} className={cn('flex-1', isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer')}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {pkg.label}
                        </span>
                        {selectedColors.length > 0 && getSupportBadge(supportLevel)}
                      </div>
                      <p className="text-xs text-steel-600 mt-0.5 leading-relaxed">
                        {pkg.description}
                      </p>
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPackage(pkgExpanded ? null : pkg.id);
                      }}
                      className="flex-shrink-0 p-1 hover:bg-surface rounded transition-colors"
                      title={pkgExpanded ? 'Hide details' : 'Show mechanics'}
                    >
                      <ChevronRight
                        className={cn(
                          'w-3.5 h-3.5 text-steel-600 transition-transform',
                          pkgExpanded ? 'rotate-90' : '',
                        )}
                      />
                    </button>
                  </div>

                  {/* Package Details / Mechanics List */}
                  {pkgExpanded && (
                    <div className="px-3 py-2 border-t border-border/50 bg-surface-interactive/30 text-xs space-y-2">
                      {/* Mechanics Keywords */}
                      <div>
                        <div className="font-medium text-steel-500 uppercase tracking-wider text-[10px]">
                          Keywords
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pkg.mechanicsTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-surface border border-border rounded text-steel-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Trigger Concepts */}
                      <div>
                        <div className="font-medium text-steel-500 uppercase tracking-wider text-[10px]">
                          Timing
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pkg.triggerTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-steel-800/40 border border-steel-700/40 rounded text-steel-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-steel-600 leading-relaxed">
            Each package is derived from official Gundam TCG mechanics research and will filter your card catalog accordingly.
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-steel-500 hover:text-foreground text-left"
            >
              ← Back
            </button>
          )}
        </div>
      )}
    </div>
  );
}
