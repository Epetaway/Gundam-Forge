'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { getAllPackages, getPackageSupportLevel } from '@gundam-forge/shared';
import type { CardColor } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';

interface PackagesStepProps {
  packages: string[];
  onPackagesChange: (packages: string[]) => void;

  /** Selected colors from Step 2 - used to filter/annotate packages */
  selectedColors?: CardColor[];

  /** Selected clans from Step 1 - future use for faction-specific filtering */
  selectedClans?: string[];
}

export default function PackagesStep({
  packages,
  onPackagesChange,
  selectedColors = [],
  selectedClans: _selectedClans = [],
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
          <span className="text-[10px] font-semibold text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">
            Strong
          </span>
        );
      case 'moderate':
        return (
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded">
            Good
          </span>
        );
      case 'limited':
        return (
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded">
            Limited
          </span>
        );
      case 'none':
        return (
          <span className="text-[10px] font-semibold text-steel-600 bg-steel-900/30 px-1.5 py-0.5 rounded">
            Unavailable
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Play Style Packages</p>
        <p className="text-xs text-steel-600">
          Optional, but recommended. Packages tune Forge ranking and improve starter suggestions.
        </p>
      </div>

      <div className="rounded-md bg-cobalt-900/20 px-2 py-2 text-xs text-cobalt-300">
        Select one or more strategy engines. You can revise this later from Forge.
      </div>

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
                'rounded-lg transition-all',
                selected
                  ? 'bg-cobalt-900/20'
                  : 'hover:bg-cobalt-900/10',
                isUnavailable && 'opacity-50',
              )}
            >
              <div className="flex items-start gap-2.5 px-3 py-2">
                <input
                  type="checkbox"
                  id={`pkg-${pkg.id}`}
                  checked={selected}
                  onChange={() => handleTogglePackage(pkg.id)}
                  disabled={isUnavailable}
                  className={cn(
                    'mt-0.5 h-4 w-4 rounded bg-surface-interactive',
                    isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer',
                  )}
                />
                <label htmlFor={`pkg-${pkg.id}`} className={cn('flex-1', isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer')}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{pkg.label}</span>
                    {selectedColors.length > 0 && getSupportBadge(supportLevel)}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-steel-600">{pkg.description}</p>
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPackage(pkgExpanded ? null : pkg.id);
                  }}
                  className="flex-shrink-0 rounded p-1 transition-colors hover:bg-cobalt-900/10"
                  title={pkgExpanded ? 'Hide details' : 'Show mechanics'}
                >
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 text-steel-600 transition-transform',
                      pkgExpanded ? 'rotate-90' : '',
                    )}
                  />
                </button>
              </div>

              {pkgExpanded && (
                <div className="space-y-2 px-3 py-2 text-xs">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-steel-500">Keywords</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pkg.mechanicsTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded px-2 py-1 text-steel-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-steel-500">Timing</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pkg.triggerTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded px-2 py-1 text-steel-400"
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

      <p className="text-xs leading-relaxed text-steel-600">
        Packages are derived from official mechanics research and used to rank cards by fit.
      </p>
    </div>
  );
}
