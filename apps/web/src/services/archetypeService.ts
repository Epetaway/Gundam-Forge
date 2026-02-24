import { supabase } from '../lib/supabase';
import { META_TIER_LIST, getMetaTierForColors, type MetaArchetype, type MetaTier } from '../data/metaTierList';

export interface ArchetypeRecord {
  id: string;
  name: string;
  colors: string[];
  tier: MetaTier | null;
  description: string | null;
  key_cards: string[];
  highlights: string | null;
}

export interface ArchetypeWithStats extends ArchetypeRecord {
  total_placements: number;
  first_place_count: number;
  top_3_count: number;
  avg_placement: number;
  win_rate: number;
  weighted_score: number;
  recent_event_count: number;
}

/** Fetch all archetypes from the database, falling back to static data */
export async function fetchArchetypes(): Promise<ArchetypeRecord[]> {
  try {
    const { data, error } = await supabase
      .from('archetypes')
      .select('*')
      .order('tier', { ascending: true });

    if (error || !data || data.length === 0) {
      return staticFallback();
    }

    return data as ArchetypeRecord[];
  } catch {
    return staticFallback();
  }
}

/** Fetch archetype stats from the materialized view */
export async function fetchArchetypeStats(): Promise<ArchetypeWithStats[]> {
  try {
    const { data, error } = await supabase
      .from('archetype_stats')
      .select('*')
      .order('weighted_score', { ascending: false });

    if (error || !data || data.length === 0) {
      return staticFallbackWithStats();
    }

    return data as ArchetypeWithStats[];
  } catch {
    return staticFallbackWithStats();
  }
}

/** Trigger a refresh of the archetype stats materialized view */
export async function refreshArchetypeStats(): Promise<void> {
  const { error } = await supabase.rpc('refresh_archetype_stats');
  if (error) throw error;
}

/** Convert static META_TIER_LIST to ArchetypeRecord format */
function staticFallback(): ArchetypeRecord[] {
  return META_TIER_LIST.map((m) => ({
    id: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    name: m.name,
    colors: m.colors,
    tier: m.tier,
    description: m.summary,
    key_cards: m.keyCards,
    highlights: m.highlights,
  }));
}

/** Convert static data to stats format with zeroed metrics */
function staticFallbackWithStats(): ArchetypeWithStats[] {
  return staticFallback().map((a) => ({
    ...a,
    total_placements: 0,
    first_place_count: 0,
    top_3_count: 0,
    avg_placement: 0,
    win_rate: 0,
    weighted_score: 0,
    recent_event_count: 0,
  }));
}

/** Look up archetype by color combination (DB-first, static fallback) */
export function getArchetypeForColors(colors: string[]): MetaArchetype | undefined {
  return getMetaTierForColors(colors);
}
