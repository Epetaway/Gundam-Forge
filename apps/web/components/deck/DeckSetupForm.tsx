'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, FileInput, Sparkles, Target, WandSparkles } from 'lucide-react';
import type { CardDefinition } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';
import { parseDeckList } from '@/app/forge/parseDeckList';
import { matchDeckEntries } from '@/app/forge/cardMatching';
import { createStoredDeck } from '@/lib/deck/storage';
import { allSets } from '@/lib/data/cards';
import { getStarterDeckTemplates } from '@/lib/deck/starterTemplates';
import type { StarterDeckTemplate } from '@/lib/deck/starterTemplates';
import { getRecommendedStarterTemplates } from '@/lib/deck/starterTemplates';
import { useDeckSetupContext } from './DeckSetupContext';
import DeckIntentBuilder from './DeckIntentBuilder';
import StarterDeckPicker from './StarterDeckPicker';

const VISIBILITIES: { value: 'private' | 'unlisted' | 'public'; label: string; desc: string }[] = [
  { value: 'private',  label: 'Private',  desc: 'Only you' },
  { value: 'unlisted', label: 'Unlisted', desc: 'Link only' },
  { value: 'public',   label: 'Public',   desc: 'Everyone' },
];

interface DeckSetupFormProps {
  cards: CardDefinition[];
}

const FIELD_CLASS =
  'w-full rounded-md border border-cobalt-900/70 bg-background/40 px-4 text-sm text-foreground outline-none placeholder:text-steel-500 focus-visible:border-cobalt-400/70 focus-visible:ring-2 focus-visible:ring-cobalt-500/25';

const SECTION_CLASS = 'space-y-4 rounded-lg bg-surface/30 p-4';

const FORM_SECTIONS = [
  { id: 'setup-basics',  label: 'Basics',  desc: 'Name & format',           icon: Target,       optional: false },
  { id: 'setup-intent',  label: 'Intent',  desc: 'Playstyle focus',          icon: Sparkles,     optional: true  },
  { id: 'setup-starter', label: 'Starter', desc: 'Pick a template',          icon: WandSparkles, optional: true  },
  { id: 'setup-import',  label: 'Import',  desc: 'Paste a list',             icon: FileInput,    optional: true  },
] as const;

type FormSectionId = (typeof FORM_SECTIONS)[number]['id'];

export default function DeckSetupForm({ cards }: DeckSetupFormProps) {
  const router = useRouter();
  const ctx = useDeckSetupContext();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [intentErrors, setIntentErrors] = useState(false);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<FormSectionId>('setup-basics');

  const templates = useMemo(
    () => getStarterDeckTemplates(8, ctx.setId || undefined),
    [ctx.setId],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.slug === selectedTemplateSlug) ?? null,
    [templates, selectedTemplateSlug],
  );

  const recommendedTemplates = useMemo(
    () => getRecommendedStarterTemplates(templates, ctx.deckIntent, 2),
    [templates, ctx.deckIntent],
  );

  const cardNameById = useMemo(
    () => new Map(cards.map((card) => [card.id, card.name])),
    [cards],
  );

  useEffect(() => {
    if (selectedTemplateSlug && !templates.some((template) => template.slug === selectedTemplateSlug)) {
      setSelectedTemplateSlug(null);
    }
  }, [selectedTemplateSlug, templates]);

  // Compute total imported card count from paste input for early warning
  const importedCount = useMemo(() => {
    const trimmed = ctx.decklist.trim();
    if (!trimmed) return null;
    const parsed = parseDeckList(trimmed);
    const result = matchDeckEntries(parsed, cards);
    return result.matched.reduce((sum, { entry }) => sum + entry.qty, 0);
  }, [ctx.decklist, cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIntentErrors(false);

    if (!ctx.name.trim()) {
      setError('Deck name is required.');
      return;
    }

    // Deck intent is optional. Once users provide any intent value, require valid colors.
    const hasIntentInputs =
      ctx.deckIntent.clans.length > 0 ||
      ctx.deckIntent.colors.length > 0 ||
      ctx.deckIntent.packages.length > 0 ||
      ctx.deckIntent.includeEX;
    const nonColorlessColors = ctx.deckIntent.colors.filter((c) => c !== 'Colorless');
    if (hasIntentInputs && (nonColorlessColors.length < 1 || nonColorlessColors.length > 2)) {
      setIntentErrors(true);
      setError('When Deck Intent is used, select 1–2 non-Colorless colors.');
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
      } else if (selectedTemplate) {
        initialEntries = selectedTemplate.entries.map((entry) => ({
          cardId: entry.cardId,
          qty: entry.qty,
        }));
      }

      const newDeck = createStoredDeck(
        {
          name: ctx.name.trim(),
          description: ctx.description.trim(),
          visibility: ctx.visibility,
          deckIntent: ctx.deckIntent,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <nav aria-label="Create deck sections" className="grid grid-cols-4 gap-2 rounded-lg bg-surface/30 p-2">
        {FORM_SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              title={section.desc}
              className={cn(
                'inline-flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold transition-colors',
                active ? 'bg-cobalt-500/18 text-cobalt-100' : 'text-steel-500 hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="leading-none">{section.label}</span>
              <span className={cn('text-[9px] font-normal leading-none', active ? 'text-cobalt-300/80' : 'text-steel-600')}>
                {section.optional ? 'optional' : `step ${idx + 1}`}
              </span>
            </button>
          );
        })}
      </nav>

      <section id="setup-basics" className={SECTION_CLASS}>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setActiveSection(activeSection === 'setup-basics' ? 'setup-intent' : 'setup-basics')}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt-300">Basics</p>
          <ChevronDown className={cn('h-4 w-4 text-steel-500 transition-transform', activeSection === 'setup-basics' ? 'rotate-180' : '')} />
        </button>

        {activeSection === 'setup-basics' && (
          <>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                Deck Name <span className="text-red-400">*</span>
              </label>
              <input
                className={cn(FIELD_CLASS, 'h-9')}
                maxLength={80}
                onChange={(e) => ctx.setName(e.target.value)}
                placeholder="e.g. Zeon Rush v2"
                required
                type="text"
                value={ctx.name}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Visibility</label>
              <div className="inline-flex rounded-md border border-cobalt-900/70 p-1">
                {VISIBILITIES.map((v) => (
                  <button
                    className={cn(
                      'flex-1 rounded px-4 py-2 text-xs font-semibold transition-colors',
                      ctx.visibility === v.value
                        ? 'border border-cobalt-400/40 bg-cobalt-500/15 text-cobalt-200 shadow-sm'
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
          </>
        )}
      </section>

      <section id="setup-intent" className={SECTION_CLASS}>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setActiveSection(activeSection === 'setup-intent' ? 'setup-starter' : 'setup-intent')}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt-300">Intent</p>
          <ChevronDown className={cn('h-4 w-4 text-steel-500 transition-transform', activeSection === 'setup-intent' ? 'rotate-180' : '')} />
        </button>

        {activeSection === 'setup-intent' && (
          <DeckIntentBuilder
            initialIntent={ctx.deckIntent}
            onIntentChange={(intent) => ctx.setDeckIntent(intent)}
            showErrors={intentErrors}
          />
        )}
      </section>

      <section id="setup-starter" className={SECTION_CLASS}>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setActiveSection(activeSection === 'setup-starter' ? 'setup-import' : 'setup-starter')}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt-300">Starter Options</p>
          <ChevronDown className={cn('h-4 w-4 text-steel-500 transition-transform', activeSection === 'setup-starter' ? 'rotate-180' : '')} />
        </button>

        {activeSection === 'setup-starter' && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="deck-set-select">
                Set / Format <span className="font-normal text-steel-600">(filters catalog and official starters)</span>
              </label>
              <select
                id="deck-set-select"
                className={cn(FIELD_CLASS, 'h-9 px-2')}
                onChange={(e) => {
                  ctx.setSetId(e.target.value);
                  setSelectedTemplateSlug(null);
                }}
                value={ctx.setId}
              >
                <option value="">All Sets</option>
                {allSets.filter((s) => s !== 'Token').map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <StarterDeckPicker
              templates={templates}
              recommendations={recommendedTemplates}
              selectedSlug={selectedTemplateSlug}
              onSelect={(template: StarterDeckTemplate | null) => {
                setSelectedTemplateSlug(template?.slug ?? null);

                if (!template) {
                  return;
                }

                const templateDecklist = template.entries
                  .map((entry) => `${entry.qty} ${cardNameById.get(entry.cardId) ?? entry.cardId}`)
                  .join('\n');

                ctx.setDecklist(templateDecklist);
              }}
            />
          </>
        )}
      </section>

      {ctx.setId && templates.length === 0 && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">
          No official starter decks matched {ctx.setId}. Choose another set or start from scratch.
        </p>
      )}

      <section id="setup-import" className={SECTION_CLASS}>
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setActiveSection(activeSection === 'setup-import' ? 'setup-basics' : 'setup-import')}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt-300">Import Deck List</p>
          <ChevronDown className={cn('h-4 w-4 text-steel-500 transition-transform', activeSection === 'setup-import' ? 'rotate-180' : '')} />
        </button>

        {activeSection === 'setup-import' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              Paste Deck List <span className="font-normal text-steel-600">(optional)</span>
            </label>
            <details className="text-xs text-steel-600">
              <summary className="cursor-pointer select-none font-medium text-cobalt-400 hover:text-cobalt-300">
                Accepted formats — click to expand
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-cobalt-900/70 bg-background/40 px-4 py-2 font-mono text-[11px] leading-relaxed text-steel-500">{`One card per line, quantity first:
  3 Amuro Ray
  Amuro Ray x3
  ST01-001 Amuro Ray x3
  Amuro Ray (3)

Lines starting with # are ignored as comments.
Unrecognized cards are listed as warnings after import.`}</pre>
            </details>
            <textarea
              className={cn(FIELD_CLASS, 'py-2 font-mono text-xs')}
              onChange={(e) => ctx.setDecklist(e.target.value)}
              placeholder={"4 Gundam\n3 Amuro Ray\n2 Mega Particle Cannon x2\n..."}
              rows={7}
              value={ctx.decklist}
            />
          </div>
        )}
      </section>

      {/* Import count warning */}
      {importedCount !== null && importedCount !== 50 && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400"
        >
          Imported {importedCount} cards — a valid main deck requires exactly 50.
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        className={cn(
          'mt-1 rounded-md bg-cobalt-600 py-2 text-sm font-bold text-white transition-all hover:bg-cobalt-500 active:scale-[0.98]',
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
