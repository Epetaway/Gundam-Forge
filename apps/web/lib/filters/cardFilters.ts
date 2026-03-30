import type { CardColor, CardType } from '@gundam-forge/shared';

export type FilterMatchMode = 'strict' | 'broad';
export type CardDeckRole = 'main' | 'resource' | 'ex';

export interface CatalogFilters {
  query?: string;
  color?: CardColor | 'All';
  colors?: CardColor[]; // Multi-color OR filter
  type?: CardType | 'All';
  set?: string;
  keyword?: string;
  zone?: string;
  deckRole?: CardDeckRole | 'All';
  clans?: string[];
  traits?: string[];
  keywords?: string[];
  triggers?: string[];
  matchMode?: FilterMatchMode;
}

const LIST_KEYS = ['clans', 'traits', 'keywords', 'triggers'] as const;

type ListKey = (typeof LIST_KEYS)[number];

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function encodeListParam(params: URLSearchParams, key: string, values?: string[]): void {
  if (!values || values.length === 0) return;
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  if (normalized.length === 0) return;
  params.set(key, normalized.join(','));
}

export function filtersFromSearchParams(searchParams: URLSearchParams): CatalogFilters {
  const filters: CatalogFilters = {
    query: searchParams.get('q') ?? undefined,
    color: (searchParams.get('color') as CardColor | 'All' | null) ?? undefined,
    type: (searchParams.get('type') as CardType | 'All' | null) ?? undefined,
    set: searchParams.get('set') ?? undefined,
    keyword: searchParams.get('keyword') ?? undefined,
    zone: searchParams.get('zone') ?? undefined,
    deckRole: (searchParams.get('deckRole') as CardDeckRole | 'All' | null) ?? undefined,
    matchMode: (searchParams.get('matchMode') as FilterMatchMode | null) ?? undefined,
  };

  const colors = parseListParam(searchParams.get('colors')) as CardColor[];
  if (colors.length > 0) {
    filters.colors = colors;
  }

  for (const key of LIST_KEYS) {
    const values = parseListParam(searchParams.get(key));
    if (values.length > 0) {
      filters[key] = values;
    }
  }

  return filters;
}

export function filtersToSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  const query = filters.query?.trim();

  if (query) params.set('q', query);
  if (filters.color && filters.color !== 'All') params.set('color', filters.color);
  if (filters.colors && filters.colors.length > 0) {
    params.set('colors', filters.colors.join(','));
  }
  if (filters.type && filters.type !== 'All') params.set('type', filters.type);
  if (filters.set && filters.set !== 'All') params.set('set', filters.set);
  if (filters.keyword && filters.keyword !== 'All') params.set('keyword', filters.keyword);
  if (filters.zone && filters.zone !== 'All') params.set('zone', filters.zone);
  if (filters.deckRole && filters.deckRole !== 'All') params.set('deckRole', filters.deckRole);
  if (filters.matchMode && filters.matchMode !== 'strict') params.set('matchMode', filters.matchMode);

  for (const key of LIST_KEYS) {
    encodeListParam(params, key, filters[key]);
  }

  return params;
}

export function parseDelimitedInput(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function matchesSelectedValues(cardValues: string[] | undefined, selected: string[], mode: FilterMatchMode): boolean {
  if (selected.length === 0) return true;
  if (!cardValues || cardValues.length === 0) return false;

  const normalizedCardValues = new Set(cardValues.map((value) => value.toLowerCase()));
  if (mode === 'broad') {
    return selected.some((value) => normalizedCardValues.has(value.toLowerCase()));
  }

  return selected.every((value) => normalizedCardValues.has(value.toLowerCase()));
}

function normalizeScalar(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === 'All') return undefined;
  return trimmed;
}

function normalizeList(values?: string[]): string[] | undefined {
  if (!values || values.length === 0) return undefined;
  const normalized = Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  return normalized.length > 0 ? normalized : undefined;
}

export interface ComparableFilters {
  query?: string;
  color?: string;
  colors?: string[];
  type?: string;
  set?: string;
  keyword?: string;
  zone?: string;
  deckRole?: string;
  matchMode?: FilterMatchMode;
  clans?: string[];
  traits?: string[];
  keywords?: string[];
  triggers?: string[];
}

export function normalizeComparableFilters(filters: ComparableFilters): ComparableFilters {
  return {
    query: normalizeScalar(filters.query),
    color: normalizeScalar(filters.color),
    colors: normalizeList(filters.colors),
    type: normalizeScalar(filters.type),
    set: normalizeScalar(filters.set),
    keyword: normalizeScalar(filters.keyword),
    zone: normalizeScalar(filters.zone),
    deckRole: normalizeScalar(filters.deckRole),
    matchMode: filters.matchMode === 'broad' ? 'broad' : undefined,
    clans: normalizeList(filters.clans),
    traits: normalizeList(filters.traits),
    keywords: normalizeList(filters.keywords),
    triggers: normalizeList(filters.triggers),
  };
}

export function getFilterMismatchKeys(selected: ComparableFilters, applied: ComparableFilters): string[] {
  const left = normalizeComparableFilters(selected);
  const right = normalizeComparableFilters(applied);
  const keys: Array<keyof ComparableFilters> = [
    'query',
    'color',
    'colors',
    'type',
    'set',
    'keyword',
    'zone',
    'deckRole',
    'matchMode',
    'clans',
    'traits',
    'keywords',
    'triggers',
  ];

  const mismatches: string[] = [];
  for (const key of keys) {
    const leftValue = left[key];
    const rightValue = right[key];
    const equal = Array.isArray(leftValue) || Array.isArray(rightValue)
      ? JSON.stringify(leftValue ?? []) === JSON.stringify(rightValue ?? [])
      : (leftValue ?? '') === (rightValue ?? '');
    if (!equal) mismatches.push(key);
  }

  return mismatches;
}
