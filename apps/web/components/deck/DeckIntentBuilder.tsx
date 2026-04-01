'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CardColor, DeckIntent } from '@gundam-forge/shared';
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

  /**
   * Render style for setup page or compact inline surfaces like Forge filters.
   */
  variant?: 'setup' | 'inline';

  /**
   * Optional callback for final step completion.
   */
  onDone?: () => void;
}

export default function DeckIntentBuilder({
  initialIntent,
  onIntentChange,
  showErrors = false,
  variant = 'setup',
  onDone,
}: DeckIntentBuilderProps) {
  const [clans, setClans] = useState<string[]>(initialIntent?.clans ?? []);
  const [colors, setColors] = useState<CardColor[]>(initialIntent?.colors ?? []);
  const [packages, setPackages] = useState<string[]>(initialIntent?.packages ?? []);
  const [includeEX, setIncludeEX] = useState(initialIntent?.includeEX ?? false);
  const [stepIndex, setStepIndex] = useState(0);
  const [visitedColorStep, setVisitedColorStep] = useState(false);

  useEffect(() => {
    setClans(initialIntent?.clans ?? []);
    setColors(initialIntent?.colors ?? []);
    setPackages(initialIntent?.packages ?? []);
    setIncludeEX(initialIntent?.includeEX ?? false);
  }, [initialIntent]);

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

  const isColorsValid = colors.length >= 1 && colors.length <= 2 && colors.some((c) => c !== 'Colorless');
  const colorErrorVisible = showErrors || visitedColorStep;

  const steps = useMemo(
    () => [
      {
        id: 'clans',
        title: 'Factions',
        status: clans.length > 0 ? `${clans.length} selected` : 'Optional',
        complete: true,
      },
      {
        id: 'colors',
        title: 'Colors',
        status: isColorsValid ? colors.join('/') : 'Required',
        complete: isColorsValid,
      },
      {
        id: 'packages',
        title: 'Play Style',
        status: packages.length > 0 ? `${packages.length} selected` : 'Optional',
        complete: true,
      },
    ],
    [clans.length, colors, isColorsValid, packages.length],
  );

  const activeStep = steps[stepIndex];

  const moveToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    if (index > stepIndex && !steps[stepIndex].complete) return;
    if (index >= 1) setVisitedColorStep(true);
    setStepIndex(index);
  };

  const handleNext = () => {
    if (stepIndex === 1) setVisitedColorStep(true);
    if (!activeStep.complete) return;
    if (stepIndex === steps.length - 1) {
      onDone?.();
      return;
    }
    setStepIndex((value) => Math.min(steps.length - 1, value + 1));
  };

  const isInline = variant === 'inline';

  return (
    <div className="flex flex-col gap-4">
      {!isInline && (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground">Deck Intent</h3>
          <p className="text-xs text-steel-600">
            Use this quick wizard to shape faction, color, and mechanic priorities before forging.
          </p>
        </div>
      )}

      <div className={cn('rounded-lg p-3', isInline ? 'p-2.5' : 'p-3')}>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isReachable = index <= stepIndex || steps[Math.max(0, index - 1)].complete;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => moveToStep(index)}
                disabled={!isReachable}
                className={cn(
                  'rounded-md px-2 py-2 text-left text-xs transition-colors',
                  isActive
                    ? 'bg-cobalt-500/15 text-cobalt-200'
                    : 'text-steel-500',
                  !isReachable ? 'cursor-not-allowed opacity-45' : 'hover:text-foreground',
                )}
              >
                <div className="font-semibold">{index + 1}. {step.title}</div>
                <div className={cn('mt-0.5 text-[11px]', step.complete ? 'text-green-400' : 'text-steel-500')}>
                  {step.status}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-md px-3 py-3">
          {stepIndex === 0 && (
            <ClansStep
              clans={clans}
              onClansChange={(newClans) => handleIntentChange({ clans: newClans })}
            />
          )}

          {stepIndex === 1 && (
            <ColorsStep
              colors={colors}
              onColorsChange={(newColors: CardColor[]) => handleIntentChange({ colors: newColors })}
              showError={colorErrorVisible && !isColorsValid}
            />
          )}

          {stepIndex === 2 && (
            <PackagesStep
              packages={packages}
              onPackagesChange={(newPackages: string[]) => handleIntentChange({ packages: newPackages })}
              selectedColors={colors}
              selectedClans={clans}
            />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => moveToStep(stepIndex - 1)}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-steel-500 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={stepIndex === 0}
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              activeStep.complete
                ? 'bg-cobalt-600 text-white hover:bg-cobalt-500'
                : 'cursor-not-allowed bg-steel-700/60 text-steel-400',
            )}
            disabled={!activeStep.complete}
          >
            {stepIndex === steps.length - 1 ? (onDone ? 'Apply Intent' : 'Finish') : 'Next'}
          </button>
        </div>
      </div>

      {(showErrors || visitedColorStep) && !isColorsValid && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Please select 1-2 non-Colorless colors.
        </p>
      )}
    </div>
  );
}
