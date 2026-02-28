'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CardColor, CardDefinition } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';
import { parseDeckList } from '@/app/forge/parseDeckList';
import { matchDeckEntries } from '@/app/forge/cardMatching';
import { createStoredDeck } from '@/lib/deck/storage';
import { allSets } from '@/lib/data/cards';
import { useDeckSetupContext } from './DeckSetupContext';

const GUNDAM_COLORS: { value: CardColor; label: string; bg: string; text: string; border: string }[] = [
  { value: 'Blue',      label: 'Blue',      bg: 'bg-blue-600',    text: 'text-white',      border: 'border-blue-500' },
  { value: 'Green',     label: 'Green',     bg: 'bg-green-600',   text: 'text-white',      border: 'border-green-500' },
  { value: 'Red',       label: 'Red',       bg: 'bg-red-600',     text: 'text-white',      border: 'border-red-500' },
  { value: 'White',     label: 'White',     bg: 'bg-white',       text: 'text-steel-900',  border: 'border-steel-300' },
  { value: 'Purple',    label: 'Purple',    bg: 'bg-purple-600',  text: 'text-white',      border: 'border-purple-500' },
  { value: 'Colorless', label: 'Colorless', bg: 'bg-steel-600',   text: 'text-white',      border: 'border-steel-500' },
];

const ARCHETYPES = ['Aggro', 'Midrange', 'Control', 'Combo', 'Ramp'];
const VISIBILITIES: { value: 'private' | 'unlisted' | 'public'; label: string; desc: string }[] = [
  { value: 'private',  label: 'Private',  desc: 'Only you' },
  { value: 'unlisted', label: 'Unlisted', desc: 'Link only' },
  { value: 'public',   label: 'Public',   desc: 'Everyone' },
];

interface DeckSetupFormProps {
  cards: CardDefinition[];
}

export default function DeckSetupForm({ cards }: DeckSetupFormProps) {
  const router = useRouter();
  const ctx = useDeckSetupContext();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nonColorlessColors = ctx.colors.filter((c) => c !== 'Colorless');

  const handleColorToggle = (color: CardColor) => {
    ctx.setColors((prev) => {
      if (prev.includes(color)) return prev.filter((c) => c !== color);
      const nonColorless = prev.filter((c) => c !== 'Colorless');
      if (color !== 'Colorless' && nonColorless.length >= 2) return prev;
      return [...prev, color];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ctx.name.trim()) {
      setError('Deck name is required.');
      return;
    }
    if (nonColorlessColors.length > 2) {
      setError('Maximum 2 non-Colorless colors allowed.');
      return;
    }

    setSubmitting(true);
    try {
      let initialEntries: { cardId: string; qty: number }[] = [];
      let importResults = null;

      if (ctx.decklist.trim()) {
        const parsed = parseDeckList(ctx.decklist);
        const result = matchDeckEntries(parsed, cards);
        initialEntries = result.matched.map(({ entry, card }) => ({
          cardId: card.id,
          qty: entry.qty,
        }));
        importResults = result;
      }

      const newDeck = createStoredDeck(
        {
          name: ctx.name.trim(),
          description: ctx.description.trim(),
          visibility: ctx.visibility,
          archetype: ctx.archetype,
          colors: ctx.colors,
          setId: ctx.setId || undefined,
        },
        initialEntries,
      );

      if (importResults && (importResults.ambiguous.length > 0 || importResults.unmatched.length > 0)) {
        sessionStorage.setItem(
          'gundam-forge.pendingImport',
          JSON.stringify(importResults),
        );
      }

      const forgeUrl = ctx.setId
        ? `/forge?deckId=${newDeck.id}&setId=${encodeURIComponent(ctx.setId)}`
        : `/forge?deckId=${newDeck.id}`;
      router.push(forgeUrl);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Deck Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">
          Deck Name <span className="text-red-400">*</span>
        </label>
        <input
          className="h-9 rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground outline-none placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          maxLength={80}
          onChange={(e) => ctx.setName(e.target.value)}
          placeholder="e.g. Zeon Rush v2"
          required
          type="text"
          value={ctx.name}
        />
      </div>

      {/* Visibility */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">Visibility</label>
        <div className="inline-flex rounded-md border border-border bg-surface-interactive p-1">
          {VISIBILITIES.map((v) => (
            <button
              className={cn(
                'flex-1 rounded px-3 py-1.5 text-xs font-semibold transition-colors',
                ctx.visibility === v.value
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-steel-600 hover:text-foreground',
              )}
              key={v.value}
              onClick={() => ctx.setVisibility(v.value)}
              title={v.desc}
              type="button"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">
          Colors{' '}
          <span className="font-normal text-steel-600">(max 2 non-Colorless)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {GUNDAM_COLORS.map((c) => {
            const active = ctx.colors.includes(c.value);
            const nonColorlessAtMax = nonColorlessColors.length >= 2 && c.value !== 'Colorless' && !active;
            return (
              <button
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                  active
                    ? `${c.bg} ${c.text} ${c.border} ring-2 ring-cobalt-400/60`
                    : 'border-border bg-surface-interactive text-steel-600 hover:border-cobalt-400/40 hover:text-foreground',
                  nonColorlessAtMax ? 'opacity-40 cursor-not-allowed' : '',
                )}
                disabled={nonColorlessAtMax}
                key={c.value}
                onClick={() => handleColorToggle(c.value)}
                type="button"
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Set / Format */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground" htmlFor="deck-set-select">
          Set / Format <span className="font-normal text-steel-600">(filters catalog)</span>
        </label>
        <select
          id="deck-set-select"
          className="h-9 rounded-md border border-border bg-surface-interactive px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          onChange={(e) => ctx.setSetId(e.target.value)}
          value={ctx.setId}
        >
          <option value="">All Sets</option>
          {allSets.filter((s) => s !== 'Token').map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Archetype */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">
          Archetype <span className="font-normal text-steel-600">(optional)</span>
        </label>
        <select
          className="h-9 rounded-md border border-border bg-surface-interactive px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          onChange={(e) => ctx.setArchetype(e.target.value)}
          value={ctx.archetype}
        >
          <option value="">Select archetype</option>
          {ARCHETYPES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">
          Description <span className="font-normal text-steel-600">(optional)</span>
        </label>
        <textarea
          className="rounded-md border border-border bg-surface-interactive px-3 py-2 text-sm text-foreground outline-none placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          maxLength={500}
          onChange={(e) => ctx.setDescription(e.target.value)}
          placeholder="Describe your strategy..."
          rows={2}
          value={ctx.description}
        />
      </div>

      {/* Paste Import */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">
          Paste Deck List <span className="font-normal text-steel-600">(optional)</span>
        </label>
        <details className="text-xs text-steel-600">
          <summary className="cursor-pointer select-none font-medium text-cobalt-400 hover:text-cobalt-300">
            Accepted formats — click to expand
          </summary>
          <pre className="mt-1.5 whitespace-pre-wrap rounded bg-surface-interactive px-3 py-2 font-mono text-[11px] leading-relaxed text-steel-500">{`One card per line, quantity first:
  3 Amuro Ray
  Amuro Ray x3
  ST01-001 Amuro Ray x3
  Amuro Ray (3)

Lines starting with # are ignored as comments.
Unrecognized cards are listed as warnings after import.`}</pre>
        </details>
        <textarea
          className="rounded-md border border-border bg-surface-interactive px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          onChange={(e) => ctx.setDecklist(e.target.value)}
          placeholder={"4 Gundam\n3 Amuro Ray\n2 Mega Particle Cannon x2\n..."}
          rows={7}
          value={ctx.decklist}
        />
      </div>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        className={cn(
          'mt-1 rounded-md bg-cobalt-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-cobalt-500 active:scale-[0.98]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        disabled={submitting || !ctx.name.trim()}
        type="submit"
      >
        {submitting ? 'Creating Deck…' : 'Create Deck & Open Forge'}
      </button>
    </form>
  );
}
