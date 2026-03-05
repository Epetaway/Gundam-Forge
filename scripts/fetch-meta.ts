/**
 * Fetches recent Gundam Card Game tournament results from the Limitless TCG API
 * and writes them to:
 *   apps/web/lib/data/events-live.json  — event records with placements
 *   apps/web/lib/data/decks-live.json   — tournament-winning decklists
 *
 * Usage:
 *   npm run fetch-meta
 *
 * Limitless TCG is the primary online tournament platform for GCG and the
 * same source used by community meta trackers. No API key required for
 * public tournament standings. Decklists are returned inline in the
 * standings response when players opt in to sharing them.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_OUT = resolve(__dirname, '../apps/web/lib/data/events-live.json');
const DECKS_OUT = resolve(__dirname, '../apps/web/lib/data/decks-live.json');
const BASE = 'https://play.limitlesstcg.com/api';
const MIN_PLAYERS = 8;
const TOP_N = 8; // max placements per event to record

// ── Limitless API shapes ─────────────────────────────────────────────────────

interface LimitlessTournament {
  id: string;
  name: string;
  date: string;
  format: string | null;
  players: number;
}

interface LimitlessCard {
  count: number;
  name: string;
  set: string;
  number: string;
}

interface LimitlessDecklist {
  unit?: LimitlessCard[];
  pilot?: LimitlessCard[];
  command?: LimitlessCard[];
  base?: LimitlessCard[];
  resource?: LimitlessCard[];
}

interface LimitlessStanding {
  name: string;     // display name
  player?: string;  // player slug
  country: string | null;
  placing: number;
  drop: number | null;
  record: { wins: number; losses: number; ties: number };
  deck?: { id: string; name: string };
  decklist?: LimitlessDecklist;
}

// ── Our EventRecord shape (matches apps/web/lib/data/events.ts) ──────────────

interface EventPlacement {
  deckId: string;
  deckName: string;
  archetype: string;
  player: string;
  placement: number;
  wins: number;
  losses: number;
  draws: number;
}

interface EventRecord {
  id: string;
  slug: string;
  name: string;
  date: string;
  format: 'standard' | 'championship' | 'regional';
  location: string;
  playerCount: number;
  placements: EventPlacement[];
}

// ── Our DeckRecord shape (matches apps/web/lib/data/decks.ts) ────────────────

interface DeckEntry {
  cardId: string;
  qty: number;
}

interface LiveDeckRecord {
  id: string;
  name: string;
  description: string;
  archetype: string;
  owner: string;
  colors: string[];
  likes: number;
  views: number;
  entries: DeckEntry[];
  updatedAt: string;
  source: 'tournament';
  eventId: string;
  placement: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'gundam-forge/meta-fetcher (github.com/gundam-forge)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function inferFormat(name: string): 'standard' | 'championship' | 'regional' {
  const lower = name.toLowerCase();
  if (lower.includes('championship') || lower.includes('invitational') || lower.includes('world')) {
    return 'championship';
  }
  if (lower.includes('regional') || lower.includes('national') || lower.includes('qualifier')) {
    return 'regional';
  }
  return 'standard';
}

function slugify(name: string, date: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') +
    '-' +
    date.slice(0, 10)
  );
}

function deckSlug(name: string): string {
  return (
    'tournament-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

const GCG_COLORS = ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];

function extractColors(deckName: string): string[] {
  return GCG_COLORS.filter((c) => deckName.includes(c));
}

function toCardId(set: string, number: string): string {
  // Pad card number to 3 digits: "5" → "005", "005" stays "005"
  return `${set}-${number.padStart(3, '0')}`;
}

function decklistToEntries(decklist: LimitlessDecklist): DeckEntry[] {
  const all: LimitlessCard[] = [
    ...(decklist.unit ?? []),
    ...(decklist.pilot ?? []),
    ...(decklist.command ?? []),
    ...(decklist.base ?? []),
    ...(decklist.resource ?? []),
  ];
  return all.map((c) => ({ cardId: toCardId(c.set, c.number), qty: c.count }));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching GCG tournament list from Limitless TCG…');
  const all = await fetchJson<LimitlessTournament[]>(
    `${BASE}/tournaments?game=GUNDAM&limit=50`,
  );

  const qualifying = all.filter((t) => t.players >= MIN_PLAYERS);
  console.log(
    `${qualifying.length}/${all.length} tournaments have ${MIN_PLAYERS}+ players — fetching standings…\n`,
  );

  const events: EventRecord[] = [];

  // Track best (lowest placement) per archetype for decks, keyed by slug
  const bestPerArchetype = new Map<string, {
    standing: LimitlessStanding;
    tournamentId: string;
    eventDate: string;
    eventName: string;
  }>();

  for (const t of qualifying) {
    const dateStr = t.date.slice(0, 10);
    process.stdout.write(`  ${t.name} (${dateStr}, ${t.players} players)…`);

    let standings: LimitlessStanding[];
    try {
      standings = await fetchJson<LimitlessStanding[]>(
        `${BASE}/tournaments/${t.id}/standings`,
      );
    } catch (err) {
      console.log(` FAILED (${err instanceof Error ? err.message : String(err)})`);
      continue;
    }

    const placements: EventPlacement[] = standings
      .filter((s) => s.deck?.id && typeof s.placing === 'number' && s.placing >= 1 && s.placing <= TOP_N)
      .map((s) => ({
        deckId: s.deck!.id,
        deckName: s.deck!.name,
        archetype: s.deck!.name,
        player: s.name,
        placement: s.placing,
        wins: s.record.wins,
        losses: s.record.losses,
        draws: s.record.ties,
      }));

    if (placements.length === 0) {
      console.log(' (no decklist data — skipped)');
      continue;
    }

    events.push({
      id: t.id,
      slug: slugify(t.name, t.date),
      name: t.name,
      date: dateStr,
      format: inferFormat(t.name),
      location: 'Online',
      playerCount: t.players,
      placements,
    });

    // Track best standing per archetype for deck extraction (prefer lower placement numbers)
    for (const s of standings) {
      if (!s.deck?.id || !s.decklist || typeof s.placing !== 'number') continue;
      const arch = deckSlug(s.deck.name);
      const existing = bestPerArchetype.get(arch);
      if (!existing || s.placing < existing.standing.placing) {
        bestPerArchetype.set(arch, {
          standing: s,
          tournamentId: t.id,
          eventDate: dateStr,
          eventName: t.name,
        });
      }
    }

    const withDecklist = standings.filter(s => s.decklist && typeof s.placing === 'number' && s.placing >= 1 && s.placing <= TOP_N).length;
    console.log(` ✓ (${placements.length} placements, ${withDecklist} with decklists)`);
  }

  // newest first
  events.sort((a, b) => b.date.localeCompare(a.date));

  writeFileSync(EVENTS_OUT, JSON.stringify(events, null, 2) + '\n', 'utf-8');
  console.log(`\nWrote ${events.length} events → ${EVENTS_OUT}`);

  // ── Build tournament deck records ─────────────────────────────────────────
  console.log(`\nBuilding deck records for ${bestPerArchetype.size} archetypes…`);
  const liveDecks: LiveDeckRecord[] = [];

  for (const [, { standing, tournamentId, eventDate, eventName }] of bestPerArchetype) {
    const deckName = standing.deck!.name;
    const entries = decklistToEntries(standing.decklist!);

    if (entries.length === 0) continue;

    const colors = extractColors(deckName);
    liveDecks.push({
      id: deckSlug(deckName),
      name: deckName,
      description: `Tournament-winning list from ${eventName} (${eventDate}). Piloted by ${standing.name} to placement #${standing.placing}.`,
      archetype: deckName,
      owner: standing.name,
      colors,
      likes: 0,
      views: 0,
      entries,
      updatedAt: `${eventDate}T00:00:00Z`,
      source: 'tournament',
      eventId: tournamentId,
      placement: standing.placing,
    });
  }

  // Sort by archetype name for stable output
  liveDecks.sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(DECKS_OUT, JSON.stringify(liveDecks, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${liveDecks.length} tournament decks → ${DECKS_OUT}`);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
