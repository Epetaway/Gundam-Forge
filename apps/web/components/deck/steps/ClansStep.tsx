'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ClansStepProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  clans: string[];
  onClansChange: (clans: string[]) => void;
}

const CLAN_OPTIONS = [
  'Earth Federation',
  'Zeon',
  'Neo Zeon',
  'AEUG',
  'Titans',
  'CB', // Celestial Being (Gundam 00)
  'Gjallarhorn', // IBO
  'Tekkadan', // IBO
  'Earth Alliance', // SEED
  'ZAFT', // SEED
  'Orb', // SEED
  'OZ', // Wing
  'Operation Meteor', // Wing
  'Mafty', // Hathaway
  'G Team', // G Gundam
  'Civilian',
  'Vagan', // AGE
  'UE', // AGE
  'Academy', // Witch from Mercury
];

export default function ClansStep({
  expanded,
  onExpandChange,
  clans,
  onClansChange,
}: ClansStepProps) {
  const [anyClansMode, setAnyClansMode] = useState(clans.length === 0);

  const handleToggleClan = (clanName: string) => {
    if (anyClansMode) setAnyClansMode(false);
    
    const newClans = clans.includes(clanName)
      ? clans.filter((c) => c !== clanName)
      : clans.length >= 3
        ? clans
        : [...clans, clanName];

    if (newClans.length === 0) {
      setAnyClansMode(true);
    }

    onClansChange(newClans);
  };

  const handleAnyClansToggle = () => {
    if (!anyClansMode) {
      setAnyClansMode(true);
      onClansChange([]);
    } else {
      setAnyClansMode(false);
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
            Step 1
          </span>
          <span className="font-semibold text-sm text-foreground">Factions / Clans</span>
          <span className="text-xs text-steel-600">(max 3)</span>
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
          {/* Any Clans Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="any-clans"
              checked={anyClansMode}
              onChange={handleAnyClansToggle}
              className="w-4 h-4 rounded border border-border bg-surface-interactive cursor-pointer"
            />
            <label htmlFor="any-clans" className="text-sm text-foreground cursor-pointer font-medium">
              Any Faction (default)
            </label>
          </div>

          {/* Clans Chips */}
          {!anyClansMode && (
            <div className="flex flex-wrap gap-2">
              {CLAN_OPTIONS.map((clan) => {
                const active = clans.includes(clan);
                const atMax = clans.length >= 3 && !active;
                return (
                  <button
                    key={clan}
                    onClick={() => handleToggleClan(clan)}
                    disabled={atMax}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                      active
                        ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-400/40'
                        : 'bg-surface-interactive border-border text-steel-600 hover:border-purple-400/40 hover:text-foreground',
                      atMax ? 'opacity-40 cursor-not-allowed' : '',
                    )}
                    type="button"
                  >
                    {clan}
                  </button>
                );
              })}
            </div>
          )}

          {/* Help Text */}
          <p className="text-xs text-steel-600 leading-relaxed">
            Choose up to 3 factions to guide card recommendations. ~79% of cards have faction tags extracted from their traits.
          </p>
        </div>
      )}
    </div>
  );
}
