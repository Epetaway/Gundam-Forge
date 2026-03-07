import type { DeckIntentPackage } from './deckIntentPackages';
import type {
  ArchetypeMetaSnapshot,
  MetaGameContext,
} from './meta-game-context';

export interface MetaDeckRecommendation {
  packageId: string;
  packageLabel: string;
  matchedArchetypes: ArchetypeMetaSnapshot[];
  averageWinRate?: number;
  strongestArchetype?: ArchetypeMetaSnapshot;
}

export class MetaTrendService {
  private readonly context: MetaGameContext;

  constructor(context: MetaGameContext) {
    this.context = context;
  }

  getArchetypeRank(archetypeId: string): number | undefined {
    return this.context.archetypes[archetypeId]?.metaRank;
  }

  getTrendDirection(archetypeId: string): 'up' | 'flat' | 'down' | undefined {
    return this.context.archetypes[archetypeId]?.trendDirection;
  }

  getArchetype(archetypeId: string): ArchetypeMetaSnapshot | undefined {
    return this.context.archetypes[archetypeId];
  }

  getTopArchetypes(limit = 5): ArchetypeMetaSnapshot[] {
    return Object.values(this.context.archetypes)
      .sort((a, b) => (a.metaRank ?? Number.MAX_SAFE_INTEGER) - (b.metaRank ?? Number.MAX_SAFE_INTEGER))
      .slice(0, limit);
  }

  getRecommendedDecks(packages: DeckIntentPackage[]): MetaDeckRecommendation[] {
    return packages.map((pkg) => {
      const matched = (pkg.archetypeIds ?? [])
        .map((id) => this.context.archetypes[id])
        .filter((entry): entry is ArchetypeMetaSnapshot => Boolean(entry))
        .sort((a, b) => (a.metaRank ?? Number.MAX_SAFE_INTEGER) - (b.metaRank ?? Number.MAX_SAFE_INTEGER));

      const avgWinRate = matched.length
        ? matched.reduce((sum, item) => sum + (item.winRate ?? 0), 0) / matched.length
        : undefined;

      return {
        packageId: pkg.id,
        packageLabel: pkg.label,
        matchedArchetypes: matched,
        averageWinRate: avgWinRate,
        strongestArchetype: matched[0],
      };
    });
  }
}
