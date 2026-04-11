import { z } from 'zod';

const CardColorSchema = z.enum(['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless']);
const CardTypeSchema = z.enum(['Unit', 'Pilot', 'Command', 'Base', 'Resource']);

export const ApiErrorCodeSchema = z.enum([
  'BAD_REQUEST',
  'FORBIDDEN',
  'UNAUTHORIZED',
  'DECK_NOT_FOUND',
  'REPLAY_NOT_FOUND',
  'RPC_ERROR',
  'INTERNAL_ERROR',
  'CONTRACT_VIOLATION',
  'INVALID_JSON',
  'PAYLOAD_VALIDATION_FAILED',
  'PIPELINE_VALIDATION_FAILED',
]);

export const ApiErrorShapeSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: ApiErrorCodeSchema.optional(),
  requestId: z.string().optional(),
  details: z.unknown().optional(),
});

export const CardPriceSchema = z
  .object({
    market: z.number().optional(),
    low: z.number().optional(),
    mid: z.number().optional(),
    high: z.number().optional(),
    foil: z.number().optional(),
  })
  .strict();

export const CardContractSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    color: CardColorSchema,
    cost: z.number().int().nonnegative(),
    type: CardTypeSchema,
    set: z.string().min(1),
    text: z.string().optional(),
    ap: z.number().int().optional(),
    hp: z.number().int().optional(),
    level: z.number().int().optional(),
    traits: z.array(z.string()).optional(),
    zone: z.string().optional(),
    linkCondition: z.string().optional(),
    apModifier: z.number().int().optional(),
    hpModifier: z.number().int().optional(),
    keywords: z.array(z.string()).optional(),
    triggers: z.array(z.string()).optional(),
    pairQualifiers: z.array(z.string()).optional(),
    mechanics: z.array(z.string()).optional(),
    normalizedName: z.string().optional(),
    clans: z.array(z.string()).optional(),
    isMainDeck: z.boolean().optional(),
    isResource: z.boolean().optional(),
    isExCard: z.boolean().optional(),
    power: z.number().int().optional(),
    placeholderArt: z.string().optional(),
    imageUrl: z.string().optional(),
    price: CardPriceSchema.optional(),
  })
  .passthrough();

const ListCsvSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string()))
  .optional();

export const CardsQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().trim().optional(),
  excludeTypes: ListCsvSchema,
});

export const CatalogFiltersSchema = z
  .object({
    query: z.string().optional(),
    color: CardColorSchema.or(z.literal('All')).optional(),
    colors: z.array(CardColorSchema).optional(),
    type: CardTypeSchema.or(z.literal('All')).optional(),
    set: z.string().optional(),
    keyword: z.string().optional(),
    zone: z.string().optional(),
    deckRole: z.enum(['main', 'resource', 'ex']).or(z.literal('All')).optional(),
    clans: z.array(z.string()).optional(),
    traits: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    triggers: z.array(z.string()).optional(),
    matchMode: z.enum(['strict', 'broad']).optional(),
  })
  .strict();

export const CardsApiResponseSchema = z
  .object({
    cards: z.array(CardContractSchema),
    nextCursor: z.string().optional(),
    total: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(100),
    appliedFilters: CatalogFiltersSchema.optional(),
  })
  .strict();

export const DeckEntrySchema = z
  .object({
    cardId: z.string().min(1),
    qty: z.number().int().positive(),
  })
  .strict();

export const DeckRecordSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    archetype: z.string(),
    owner: z.string(),
    colors: z.array(CardColorSchema),
    likes: z.number().int().nonnegative(),
    views: z.number().int().nonnegative(),
    entries: z.array(DeckEntrySchema),
    updatedAt: z.string().optional(),
    source: z.enum(['catalog', 'tournament']).optional(),
    eventId: z.string().optional(),
    placement: z.number().int().positive().optional(),
  })
  .strict();

export const DecksQuerySchema = z.object({
  q: z.string().trim().optional(),
  color: z.string().trim().optional(),
  archetype: z.string().trim().optional(),
});

export const DecksApiResponseSchema = z
  .object({
    decks: z.array(DeckRecordSchema),
  })
  .strict();

export const TrendDirectionSchema = z.enum(['up', 'flat', 'down']);

export const DeckAnalyticsDtoSchema = z
  .object({
    deckId: z.string().min(1),
    snapshotDate: z.string().min(1),
    viewCountDelta: z.number().int().nonnegative(),
    likeCountDelta: z.number().int().nonnegative(),
    metaProximityScore: z.number().min(0).max(100),
    consistencyIndex: z.number().min(0).max(100),
    archetypePopularityRank: z.number().int().positive().nullable(),
    colorComboRank: z.number().int().positive().nullable(),
    trendDirection: TrendDirectionSchema,
    sparklineDates: z.array(z.string()),
    sparklineScores: z.array(z.number()),
  })
  .strict();

export const DeckCardAnalyticsDtoSchema = z
  .object({
    cardId: z.string().min(1),
    inclusionRateInArchetype: z.number().min(0).max(1),
    performanceScore: z.number().nonnegative(),
    trendDirection: TrendDirectionSchema,
  })
  .strict();

export const DeckMetaComparisonDtoSchema = z
  .object({
    deckId: z.string().min(1),
    deckArchetype: z.string(),
    metaProximityScore: z.number().min(0).max(100),
    topArchetypes: z.array(z.string()),
    archetypeMetaShares: z.array(z.number()),
    archetypeWinRates: z.array(z.number()),
  })
  .strict();

export const DeckAnalyticsSummaryResponseSchema = z
  .object({
    analytics: DeckAnalyticsDtoSchema.nullable(),
  })
  .strict();

export const DeckAnalyticsCardsResponseSchema = z
  .object({
    cards: z.array(DeckCardAnalyticsDtoSchema),
  })
  .strict();

export const DeckAnalyticsComparisonResponseSchema = z
  .object({
    comparison: DeckMetaComparisonDtoSchema.nullable(),
  })
  .strict();

export const PlaytesterActionCategorySchema = z.enum([
  'setup',
  'draw',
  'resource',
  'main',
  'combat',
  'trigger',
  'rules',
  'system',
]);

export const PlaytesterReplayActionSchema = z
  .object({
    id: z.string().min(1),
    timestamp: z.number().int().nonnegative(),
    turnNumber: z.number().int().positive(),
    playerId: z.string().min(1),
    actionType: z.string().min(1),
    category: PlaytesterActionCategorySchema,
    description: z.string().min(1),
    rulesTrace: z.string().min(1),
    cardIds: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const PlaytesterPostGameMetricsSchema = z
  .object({
    winnerPlayerId: z.string().nullable(),
    turnCount: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
    totalActions: z.number().int().nonnegative(),
    actionsByCategory: z.record(z.number().int().nonnegative()),
    actionsByPlayer: z.record(z.number().int().nonnegative()),
  })
  .strict();

export const PlaytesterReplaySchema = z
  .object({
    replayVersion: z.literal('1.0'),
    gameId: z.string().min(1),
    deckId: z.string().min(1),
    createdAt: z.string(),
    actions: z.array(PlaytesterReplayActionSchema),
    metrics: PlaytesterPostGameMetricsSchema,
  })
  .strict();

export const PlaytesterReplayGetResponseSchema = z
  .object({
    replay: PlaytesterReplaySchema.nullable(),
  })
  .strict();

export const PlaytesterReplayPostRequestSchema = z
  .object({
    replay: PlaytesterReplaySchema,
  })
  .strict();

export const PlaytesterReplayPostResponseSchema = z
  .object({
    accepted: z.boolean(),
    replayVersion: z.literal('1.0'),
    gameId: z.string().min(1),
  })
  .strict();

export const PlaytesterActionLogsQuerySchema = z.object({
  category: PlaytesterActionCategorySchema.optional(),
  playerId: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().trim().optional(),
});

export const PlaytesterActionLogsResponseSchema = z
  .object({
    actions: z.array(PlaytesterReplayActionSchema),
    nextCursor: z.string().optional(),
    total: z.number().int().nonnegative(),
    limit: z.number().int().min(1).max(200),
  })
  .strict();

export const PlaytesterMetricsPostRequestSchema = z
  .object({
    gameId: z.string().min(1),
    deckId: z.string().min(1),
    metrics: PlaytesterPostGameMetricsSchema,
  })
  .strict();

export const PlaytesterMetricsPostResponseSchema = z
  .object({
    accepted: z.boolean(),
    replayVersion: z.literal('1.0'),
  })
  .strict();

export const PlaytesterMetricsGetResponseSchema = z
  .object({
    metrics: PlaytesterPostGameMetricsSchema.nullable(),
  })
  .strict();

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiErrorShape = z.infer<typeof ApiErrorShapeSchema>;
export type CardContract = z.infer<typeof CardContractSchema>;
export type CardsQuery = z.infer<typeof CardsQuerySchema>;
export type CardsApiResponse = z.infer<typeof CardsApiResponseSchema>;
export type DecksQuery = z.infer<typeof DecksQuerySchema>;
export type DecksApiResponse = z.infer<typeof DecksApiResponseSchema>;
export type DeckAnalyticsDto = z.infer<typeof DeckAnalyticsDtoSchema>;
export type DeckCardAnalyticsDto = z.infer<typeof DeckCardAnalyticsDtoSchema>;
export type DeckMetaComparisonDto = z.infer<typeof DeckMetaComparisonDtoSchema>;
export type PlaytesterReplay = z.infer<typeof PlaytesterReplaySchema>;
export type PlaytesterPostGameMetrics = z.infer<typeof PlaytesterPostGameMetricsSchema>;
export type PlaytesterActionLogsQuery = z.infer<typeof PlaytesterActionLogsQuerySchema>;