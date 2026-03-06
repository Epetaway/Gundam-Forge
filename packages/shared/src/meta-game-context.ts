import type { CardColor } from './types';
import type { AbilityTrigger } from './card-ability-registry';

export interface ArchetypeMetaSnapshot {
  archetypeId: string;
  name: string;
  colors: CardColor[];
  tier: 1 | 2 | 3 | 4;
  metaRank?: number;
  winRate?: number;
  playRate?: number;
  trendDirection?: 'up' | 'flat' | 'down';
  updatedAt?: string;
}

export interface PackageMetaLink {
  packageId: string;
  packageLabel: string;
  archetypeIds: string[];
  triggerTags: string[];
  mechanicsTags: string[];
}

export interface AbilityMetaLink {
  abilityId: string;
  trigger: AbilityTrigger;
  linkedPackageIds: string[];
  linkedArchetypeIds: string[];
}

export interface MetaGameContext {
  version: string;
  generatedAt: string;
  abilities: Record<string, AbilityMetaLink>;
  packages: Record<string, PackageMetaLink>;
  archetypes: Record<string, ArchetypeMetaSnapshot>;
}

export function createEmptyMetaGameContext(version = 'v1'): MetaGameContext {
  return {
    version,
    generatedAt: new Date().toISOString(),
    abilities: {},
    packages: {},
    archetypes: {},
  };
}

export function getArchetypesForAbility(
  context: MetaGameContext,
  abilityId: string,
): ArchetypeMetaSnapshot[] {
  const link = context.abilities[abilityId];
  if (!link) return [];
  return link.linkedArchetypeIds
    .map((id) => context.archetypes[id])
    .filter((entry): entry is ArchetypeMetaSnapshot => Boolean(entry));
}

export function getArchetypesForPackage(
  context: MetaGameContext,
  packageId: string,
): ArchetypeMetaSnapshot[] {
  const link = context.packages[packageId];
  if (!link) return [];
  return link.archetypeIds
    .map((id) => context.archetypes[id])
    .filter((entry): entry is ArchetypeMetaSnapshot => Boolean(entry));
}
