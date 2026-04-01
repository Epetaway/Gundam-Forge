'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ClansStepProps {
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
  clans,
  onClansChange,
}: ClansStepProps) {
  const [anyClansMode, setAnyClansMode] = useState(clans.length === 0);

  useEffect(() => {
    setAnyClansMode(clans.length === 0);
  }, [clans]);

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
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Factions / Clans</p>
        <p className="text-xs text-steel-600">Pick up to 3 factions or leave this open for flexible suggestions.</p>
      </div>

      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <input
          type="checkbox"
          id="any-clans"
          checked={anyClansMode}
          onChange={handleAnyClansToggle}
          className="h-4 w-4 cursor-pointer rounded bg-surface-interactive"
        />
        <label htmlFor="any-clans" className="cursor-pointer text-sm font-medium text-foreground">
          Any Faction (default)
        </label>
      </div>

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
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  active
                    ? 'bg-cobalt-600 text-white ring-2 ring-cobalt-400/40'
                    : 'text-steel-600 hover:text-foreground',
                  atMax ? 'cursor-not-allowed opacity-40' : '',
                )}
                type="button"
              >
                {clan}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-relaxed text-steel-600">
        Selected factions shape recommendations and grouping in Forge. Many cards include faction tags in their traits.
      </p>
    </div>
  );
}
