'use client';

import { useState, useMemo } from 'react';
import type { CardColor, DeckIntent } from '@gundam-forge/shared';
import { getAllPackages, getPackagesByIds, getMechanicsFromPackages } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';
import ClansStep from './steps/ClansStep';
import ColorsStep from './steps/ColorsStep';
import PackagesStep from './steps/PackagesStep';

interface DeckIntentBuilderProps {
  /**
   * Initial intent state (e.g., from edit mode)
   */
  initialIntent?: DeckIntent;

  /**
   * Callback when intent changes
   */
  onIntentChange: (intent: DeckIntent) => void;

  /**
   * Show validation errors
   */
  showErrors?: boolean;
}

export default function DeckIntentBuilder({
  initialIntent,
  onIntentChange,
  showErrors = false,
}: DeckIntentBuilderProps) {
  // Initialize intent state
  const [clans, setClans] = useState<string[]>(initialIntent?.clans ?? []);
  const [colors, setColors] = useState<CardColor[]>(initialIntent?.colors ?? []);
  const [packages, setPackages] = useState<string[]>(initialIntent?.packages ?? []);
  const [includeEX, setIncludeEX] = useState(initialIntent?.includeEX ?? false);

  // Track expanded steps for accordion
  const [expandedStep, setExpandedStep] = useState<'clans' | 'colors' | 'packages' | null>('clans');

  // Build complete intent object
  const intent: DeckIntent = useMemo(
    () => ({
      clans,
      colors,
      packages,
      includeEX,
      setOrFormatId: initialIntent?.setOrFormatId,
    }),
    [clans, colors, packages, includeEX, initialIntent?.setOrFormatId],
  );

  // Notify parent whenever intent changes
  const handleIntentChange = (updatedIntent: Partial<DeckIntent>) => {
    const newIntent: DeckIntent = {
      clans: updatedIntent.clans ?? intent.clans,
      colors: updatedIntent.colors ?? intent.colors,
      packages: updatedIntent.packages ?? intent.packages,
      includeEX: updatedIntent.includeEX ?? intent.includeEX,
      setOrFormatId: updatedIntent.setOrFormatId ?? intent.setOrFormatId,
    };
    
    setClans(newIntent.clans);
    setColors(newIntent.colors);
    setPackages(newIntent.packages);
    setIncludeEX(newIntent.includeEX);
    
    onIntentChange(newIntent);
  };

  // Get selected packages for display
  const selectedPackages = getPackagesByIds(packages);
  const allMechanics = getMechanicsFromPackages(packages);

  // Validation helper
  const isColorsValid = colors.length >= 1 && colors.length <= 2 && colors.some((c) => c !== 'Colorless');

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">Deck Intent (Optional)</h3>
        <p className="text-xs text-steel-600">
          Choose your preferred factions, colors, and strategic mechanics to guide the card catalog.
        </p>
      </div>

      {/* Accordion Steps */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-interactive">
        {/* Step 1: Clans */}
        <ClansStep
          expanded={expandedStep === 'clans'}
          onExpandChange={(expanded) => setExpandedStep(expanded ? 'clans' : null)}
          clans={clans}
          onClansChange={(newClans) => handleIntentChange({ clans: newClans })}
        />

        {/* Step 2: Colors */}
        <ColorsStep
          expanded={expandedStep === 'colors'}
          onExpandChange={(expanded: boolean) => setExpandedStep(expanded ? 'colors' : null)}
          colors={colors}
          onColorsChange={(newColors: CardColor[]) => handleIntentChange({ colors: newColors })}
          showError={showErrors && !isColorsValid}
          onBack={() => setExpandedStep('clans')}
        />

        {/* Step 3: Packages */}
        <PackagesStep
          expanded={expandedStep === 'packages'}
          onExpandChange={(expanded: boolean) => setExpandedStep(expanded ? 'packages' : null)}
          packages={packages}
          onPackagesChange={(newPackages: string[]) => handleIntentChange({ packages: newPackages })}
          selectedColors={colors}
          selectedClans={clans}
          onBack={() => setExpandedStep('colors')}
        />
      </div>

      {/* EX Toggle */}
      <div className="flex items-center gap-2.5">
        <label
          className="flex items-center gap-2 cursor-pointer flex-1"
          htmlFor="include-ex-toggle"
        >
          <input
            id="include-ex-toggle"
            type="checkbox"
            checked={includeEX}
            onChange={(e) => handleIntentChange({ includeEX: e.target.checked })}
            className="w-4 h-4 rounded border border-border bg-surface-interactive cursor-pointer"
          />
          <span className="text-sm text-foreground font-medium">Include EX Cards</span>
        </label>
        <div className="group relative cursor-help">
          <span className="text-xs text-steel-600 hover:text-steel-500">?</span>
          <div className="absolute hidden group-hover:flex bottom-full right-0 mb-1 bg-surface-interactive border border-border rounded px-2 py-1 text-xs text-steel-600 whitespace-nowrap">
            EX Base and EX Resource cards excluded from main deck
          </div>
        </div>
      </div>

      {/* Intent Summary Card */}
      <div className="rounded-lg border border-border bg-cobalt-900/10 px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-steel-600 uppercase tracking-wider">Summary</div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {/* Clans */}
            <div>
              <span className="text-steel-600 font-medium">Clans:</span>{' '}
              <span className="text-foreground">
                {clans.length === 0 ? 'Any' : clans.join(', ')}
              </span>
            </div>

            {/* Colors */}
            <div>
              <span className="text-steel-600 font-medium">Colors:</span>{' '}
              <span className="text-foreground">
                {colors.length === 0 ? '—' : colors.join(', ')}
              </span>
            </div>

            {/* Packages Count */}
            <div>
              <span className="text-steel-600 font-medium">Packages:</span>{' '}
              <span className="text-foreground">
                {packages.length === 0 ? 'None' : packages.length}
              </span>
            </div>

            {/* EX Status */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-steel-600 font-medium">EX:</span>{' '}
              <span className={cn('font-medium', includeEX ? 'text-green-400' : 'text-steel-600')}>
                {includeEX ? 'Included' : 'Excluded'}
              </span>
            </div>
          </div>

          {/* Selected Packages Inline */}
          {packages.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="text-steel-600 font-medium text-xs mb-1">Selected Mechanics:</div>
              <div className="flex flex-wrap gap-1">
                {selectedPackages.map((pkg) => (
                  <span
                    key={pkg.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-cobalt-600/30 text-cobalt-300 border border-cobalt-500/30"
                  >
                    {pkg.label}
                  </span>
                ))}
              </div>
              
              {/* Mechanics Keywords */}
              {allMechanics.length > 0 && (
                <div className="mt-2">
                  <div className="text-steel-600 font-medium text-xs mb-1">Keywords:</div>
                  <div className="flex flex-wrap gap-1">
                    {allMechanics.map((mech) => (
                      <span
                        key={mech}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-steel-700/40 text-steel-400"
                      >
                        {mech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {showErrors && !isColorsValid && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Please select 1–2 non-Colorless colors
        </p>
      )}
    </div>
  );
}
