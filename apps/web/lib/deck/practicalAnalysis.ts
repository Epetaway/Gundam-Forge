import type { DeckAnalyticsDto } from '@/lib/api/deckAnalytics';
import type { DeckViewItem } from '@/lib/deck/sortFilter';
import { extractEffectKeywords } from '@/lib/search/extractEffectKeywords';

const MECHANIC_CARD_IDS: Record<string, Set<string>> = {
  blocker: new Set(['GD02-021', 'GD03-072']),
  repair: new Set(['GD03-001', 'ST08-018']),
  burst: new Set(['ST05-016', 'GD03-173']),
  high_maneuver: new Set(['ST01-051']),
  first_strike: new Set(['GD01-014', 'GD03-049']),
  breach: new Set(['GD03-022', 'GD03-018']),
  suppression: new Set(['GD03-025', 'ST02-036']),
  destroyed: new Set(['ST03-044', 'GD03-059']),
  paired: new Set(['ST01-020', 'GD03-106']),
  link: new Set(['ST03-035', 'ST02-051']),
  support: new Set(['ST01-009', 'ST07-045']),
  deploy: new Set(['GD03-051', 'ST05-014']),
  activate_main: new Set(['ST01-009', 'ST05-022']),
  activate_action: new Set(['ST06-010']),
};

function hasAnyMechanic(cardId: string, mechanics: string[]): boolean {
  return mechanics.some((mechanic) => MECHANIC_CARD_IDS[mechanic]?.has(cardId) ?? false);
}

export interface PracticalCurveBucket {
  costLabel: string;
  count: number;
}

export interface PracticalColorRow {
  color: string;
  count: number;
  share: number;
  avgCost: number;
}

export interface PracticalRoleRow {
  role: string;
  qty: number;
  oddsByTurn3: number;
  oddsByTurn5: number;
}

export interface PracticalMatchupRow {
  label: string;
  value: string;
}

export interface PracticalDeckAnalysis {
  mainDeckCount: number;
  resourceCount: number;
  avgCost: number;
  consistency: number;
  curve: PracticalCurveBucket[];
  colors: PracticalColorRow[];
  roles: PracticalRoleRow[];
  matchups: PracticalMatchupRow[];
}

interface RoleCounter {
  qty: number;
  cardIds: Set<string>;
}

const ROLE_ORDER = ['Removal', 'Draw', 'Ramp', 'Defense', 'Evasion', 'Finisher', 'Synergy', 'Tokens'];

const ROLE_RULES: Record<string, { mechanics?: string[]; textPatterns?: RegExp[] }> = {
  Removal: {
    mechanics: ['suppression', 'destroyed'],
    textPatterns: [/destroy|ko|return.*hand|deal\s+\d+\s+damage|trash target/i],
  },
  Draw: {
    textPatterns: [/draw\s+\d|draw a card|look at top/i],
  },
  Ramp: {
    textPatterns: [/resource|add.*resource|gain.*resource|recover.*resource/i],
  },
  Defense: {
    mechanics: ['blocker', 'repair', 'burst'],
    textPatterns: [/blocker|repair|prevent|cannot be attacked/i],
  },
  Evasion: {
    mechanics: ['high_maneuver', 'first_strike', 'breach'],
    textPatterns: [/high-maneuver|first strike|breach|unblockable/i],
  },
  Finisher: {
    textPatterns: [/double damage|cannot block|when this attacks.*base|end the game/i],
  },
  Synergy: {
    mechanics: ['paired', 'link', 'support', 'deploy', 'activate_main', 'activate_action'],
    textPatterns: [/when paired|during pair|when linked|during link|support|deploy/i],
  },
  Tokens: {
    textPatterns: [/token|create.*token|put.*token/i],
  },
};

const ROLE_EFFECT_KEYWORDS: Record<string, string[]> = {
  Removal: ['destroy', 'deal_damage', 'damage_all', 'return_to_hand'],
  Draw: ['draw', 'look'],
  Ramp: ['place_resource', '0_cost'],
  Defense: ['cant_be_destroyed'],
  Evasion: ['cant_be_blocked'],
  Finisher: ['deal_damage'],
  Synergy: ['pair', 'grant_keyword', 'set_active'],
  Tokens: ['deploy_token'],
};

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function nChooseK(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const r = Math.min(k, n - k);
  let out = 1;
  for (let i = 1; i <= r; i++) {
    out = (out * (n - r + i)) / i;
  }
  return out;
}

export function calculateDrawOddsAtLeast(
  targetHits: number,
  population: number,
  successStates: number,
  draws: number,
): number {
  if (targetHits <= 0) return 1;
  if (population <= 0 || draws <= 0 || successStates <= 0) return 0;

  const cappedDraws = Math.min(draws, population);
  const maxMisses = targetHits - 1;
  let cumulative = 0;

  for (let i = 0; i <= maxMisses; i++) {
    const top = nChooseK(successStates, i) * nChooseK(population - successStates, cappedDraws - i);
    const bottom = nChooseK(population, cappedDraws);
    if (bottom > 0) cumulative += top / bottom;
  }

  return Math.min(1, Math.max(0, 1 - cumulative));
}

function inferRoles(items: DeckViewItem[]): Record<string, RoleCounter> {
  const counters: Record<string, RoleCounter> = Object.fromEntries(
    ROLE_ORDER.map((role) => [role, { qty: 0, cardIds: new Set<string>() }]),
  );

  for (const item of items) {
    if (item.typeLine === 'Resource') continue;

    const text = (item.text ?? '').toLowerCase();
    const effects = extractEffectKeywords(item.text ?? '');
    for (const role of ROLE_ORDER) {
      const cfg = ROLE_RULES[role];
      const mechanicMatch = cfg.mechanics?.length
        ? hasAnyMechanic(item.id, cfg.mechanics)
        : false;
      const textMatch = cfg.textPatterns?.some((p) => p.test(text)) ?? false;
      const effectMatch = (ROLE_EFFECT_KEYWORDS[role] ?? []).some((keyword) => effects.includes(keyword));

      // Finisher fallback by stats/cost even if text is quiet.
      const finisherFallback = role === 'Finisher' && ((item.cmc ?? 0) >= 6 || (item.ap ?? 0) >= 5);

      if (mechanicMatch || effectMatch || textMatch || finisherFallback) {
        counters[role].qty += item.qty;
        counters[role].cardIds.add(item.id);
      }
    }
  }

  return counters;
}

function makeCurve(items: DeckViewItem[]): PracticalCurveBucket[] {
  const buckets = new Map<string, number>([
    ['0', 0],
    ['1', 0],
    ['2', 0],
    ['3', 0],
    ['4', 0],
    ['5', 0],
    ['6', 0],
    ['7', 0],
    ['8+', 0],
  ]);

  for (const item of items) {
    if (item.typeLine === 'Resource') continue;
    const bucket = item.cmc >= 8 ? '8+' : String(Math.max(0, item.cmc));
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + item.qty);
  }

  return Array.from(buckets.entries()).map(([costLabel, count]) => ({ costLabel, count }));
}

function makeColorRows(items: DeckViewItem[]): PracticalColorRow[] {
  const colorMap = new Map<string, { count: number; totalCost: number }>();

  for (const item of items) {
    if (item.typeLine === 'Resource') continue;
    const color = item.color && item.color.trim().length > 0 ? item.color : 'Colorless';
    const bucket = colorMap.get(color) ?? { count: 0, totalCost: 0 };
    bucket.count += item.qty;
    bucket.totalCost += item.qty * (item.cmc ?? 0);
    colorMap.set(color, bucket);
  }

  const total = Array.from(colorMap.values()).reduce((sum, row) => sum + row.count, 0);
  return Array.from(colorMap.entries())
    .map(([color, row]) => ({
      color,
      count: row.count,
      share: total > 0 ? (row.count / total) * 100 : 0,
      avgCost: row.count > 0 ? row.totalCost / row.count : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function makeOfficialMetaRows(serverAnalytics?: DeckAnalyticsDto | null): PracticalMatchupRow[] {
  if (!serverAnalytics) {
    return [
      { label: 'Source', value: 'No official snapshot available yet' },
    ];
  }

  return [
    {
      label: 'Source',
      value: 'Official Gundam-Forge analytics snapshot',
    },
    {
      label: 'Snapshot Date',
      value: serverAnalytics.snapshotDate,
    },
    {
      label: 'Archetype Rank',
      value: serverAnalytics.archetypePopularityRank !== null
        ? `#${serverAnalytics.archetypePopularityRank}`
        : 'N/A',
    },
    {
      label: 'Color Rank',
      value: serverAnalytics.colorComboRank !== null
        ? `#${serverAnalytics.colorComboRank}`
        : 'N/A',
    },
    {
      label: 'Trend',
      value: serverAnalytics.trendDirection,
    },
  ];
}

export function buildPracticalDeckAnalysis(
  items: DeckViewItem[],
  serverAnalytics?: DeckAnalyticsDto | null,
  liveConsistencyIndex?: number,
): PracticalDeckAnalysis {
  const mainItems = items.filter((item) => item.typeLine !== 'Resource');
  const resourceCount = items
    .filter((item) => item.typeLine === 'Resource')
    .reduce((sum, item) => sum + item.qty, 0);
  const mainDeckCount = mainItems.reduce((sum, item) => sum + item.qty, 0);

  const totalCost = mainItems.reduce((sum, item) => sum + (item.cmc ?? 0) * item.qty, 0);
  const avgCost = mainDeckCount > 0 ? totalCost / mainDeckCount : 0;

  const curve = makeCurve(items);
  const colors = makeColorRows(items);

  const roleCounters = inferRoles(items);
  const roleRows: PracticalRoleRow[] = ROLE_ORDER.map((role) => {
    const qty = roleCounters[role].qty;
    const oddsT3 = calculateDrawOddsAtLeast(1, Math.max(mainDeckCount, 1), qty, 7);
    const oddsT5 = calculateDrawOddsAtLeast(1, Math.max(mainDeckCount, 1), qty, 9);

    return {
      role,
      qty,
      oddsByTurn3: clampPct(oddsT3 * 100),
      oddsByTurn5: clampPct(oddsT5 * 100),
    };
  }).filter((row) => row.qty > 0);

  const matchups = makeOfficialMetaRows(serverAnalytics);

  const consistency = liveConsistencyIndex
    ?? serverAnalytics?.consistencyIndex
    ?? Math.max(0, Math.min(100, (50 - Math.abs(mainDeckCount - 50)) + resourceCount * 2 - avgCost * 4));

  return {
    mainDeckCount,
    resourceCount,
    avgCost,
    consistency,
    curve,
    colors,
    roles: roleRows,
    matchups,
  };
}
