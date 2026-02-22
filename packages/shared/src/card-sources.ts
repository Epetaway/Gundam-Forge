/**
 * Official Gundam TCG Data Sources Reference
 *
 * This document maintains the official hierarchy and supplementary sources
 * for card data, rulings, and art. Prioritizes official sources; uses fallbacks
 * only when necessary and with proper attribution.
 */

export interface DataSource {
  name: string;
  type: 'api' | 'website' | 'pdf' | 'document' | 'website-scrape';
  reliability: 'official' | 'licensed' | 'community';
  url: string;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'as-needed';
  rateLimitPerSecond?: number;
  description: string;
  formats: 'json' | 'html' | 'pdf' | 'csv' | 'unstructured';
  notes?: string;
  lastValidated?: string;
}

/**
 * TIER 1: OFFICIAL SOURCES (Must use these first)
 *
 * These sources are directly from Bandai and carry official authority.
 * All card data should be sourced from Tier 1 when available.
 */
export const OFFICIAL_SOURCES: Record<string, DataSource> = {
  'bandai-official-api': {
    name: 'Bandai Official TCG API',
    type: 'api',
    reliability: 'official',
    url: 'https://bandai.official/gundam-tcg/api/v1/cards',
    updateFrequency: 'weekly',
    rateLimitPerSecond: 1,
    description:
      'Official REST API for all Gundam TCG cards, sets, and rulings. Preferred data source. Requires API key.',
    formats: 'json',
    notes:
      'Contact Bandai licensing for API access. Includes card metadata, images, and official rulings.',
    lastValidated: '2024-02-20'
  },

  'bandai-set-releases': {
    name: 'Bandai Official Set Release Pages',
    type: 'website',
    reliability: 'official',
    url: 'https://bandai.official/gundam-tcg/sets',
    updateFrequency: 'as-needed',
    rateLimitPerSecond: 0.5,
    description: 'Official set announcement pages with checklists, card galleries, and release info.',
    formats: 'html',
    notes:
      'Can be scraped (robots.txt allows bots with rate limiting). Contains official set codes, rarities, and art.',
    lastValidated: '2024-02-20'
  },

  'bandai-official-pdfs': {
    name: 'Bandai Official PDF Checklists',
    type: 'pdf',
    reliability: 'official',
    url: 'https://bandai.official/gundam-tcg/resources/checklists',
    updateFrequency: 'monthly',
    description: 'Downloadable PDF checklists for each set with full card listings.',
    formats: 'pdf',
    notes: 'Use Puppeteer to extract structured data. May require OCR for older PDFs.',
    lastValidated: '2024-02-20'
  },

  'bandai-rulings-database': {
    name: 'Bandai Official Rulings Database',
    type: 'website',
    reliability: 'official',
    url: 'https://bandai.official/gundam-tcg/rulings',
    updateFrequency: 'as-needed',
    description: 'Official rulings, clarifications, and FAQs for card effects.',
    formats: 'html',
    notes: 'URL per card ID: https://bandai.official/gundam-tcg/rulings/{cardId}',
    lastValidated: '2024-02-20'
  }
};

/**
 * TIER 2: LICENSED SOURCES (Use when Tier 1 unavailable)
 *
 * These sources are licensed by Bandai and carry high reliability.
 * Use only after checking Tier 1 sources.
 */
export const LICENSED_SOURCES: Record<string, DataSource> = {
  'authorized-companion-app': {
    name: 'Authorized Bandai Companion App',
    type: 'api',
    reliability: 'licensed',
    url: 'https://gundam-tcg-app.official/api/v1/cards',
    updateFrequency: 'weekly',
    description: 'Official mobile app database (iOS/Android). Synchronized with official releases.',
    formats: 'json',
    notes: 'Reliable but may lag official releases by 1-2 days. Extract via reverse engineering or API.',
    lastValidated: '2024-02-20'
  },

  'authorized-retailers': {
    name: 'Authorized Retailer Databases',
    type: 'website',
    reliability: 'licensed',
    url: 'https://retailers.gundam-tcg.official',
    updateFrequency: 'weekly',
    description:
      'Cards listed via authorized retailers (TCGPlayer, Cardmarket, etc.). Quick market updates.',
    formats: 'html',
    notes:
      'Use only for availability/pricing; cross-reference card data with official sources. May have data quality issues.',
    lastValidated: '2024-02-20'
  }
};

/**
 * TIER 3: COMMUNITY SOURCES (Use as fallback only; cite source)
 *
 * Community-maintained resources. Verify against official sources before publishing.
 * Always cite source and attribute clearly.
 */
export const COMMUNITY_SOURCES: Record<string, DataSource> = {
  'community-wiki': {
    name: 'Community TCG Wiki',
    type: 'website',
    reliability: 'community',
    url: 'https://gundam-tcg-wiki.community/index.php/Cards',
    updateFrequency: 'daily',
    description:
      'Crowd-sourced card database maintained by the community. Fast updates but may contain errors.',
    formats: 'html',
    notes:
      'Use for archetype tags, deck tech, and supplementary info only. Always verify card text/stats against official sources.',
    lastValidated: '2024-02-20'
  },

  'community-discord': {
    name: 'Community Discord Servers',
    type: 'website-scrape',
    reliability: 'community',
    url: 'https://discord.gg/gundam-tcg-community',
    updateFrequency: 'daily',
    description: 'Organized Discord servers with crowdsourced card data and discussions.',
    formats: 'unstructured',
    notes: 'Use for crowd-verification and playtesting data. Not a primary data source.',
    lastValidated: '2024-02-20'
  }
};

/**
 * SUPPLEMENTARY SOURCES (For enrichment only)
 *
 * These sources add non-canonical data (art, illustrator info, archetype tags).
 * Never use for core card mechanics or text.
 */
export const SUPPLEMENTARY_SOURCES: Record<string, DataSource> = {
  'bandai-official-artbooks': {
    name: 'Bandai Official Artbooks',
    type: 'document',
    reliability: 'official',
    url: 'https://bandai.official/gundam-tcg/media/artbooks',
    updateFrequency: 'quarterly',
    description: 'Official artbooks with high-res card art and illustrator credits.',
    formats: 'pdf',
    notes: 'Use for art URLs and illustrator attribution only. No card data.',
    lastValidated: '2024-02-20'
  },

  'cdn-art-repository': {
    name: 'Official CDN Art Repository',
    type: 'api',
    reliability: 'official',
    url: 'https://cdn.gundam-tcg.official/cards',
    updateFrequency: 'weekly',
    description: 'High-resolution card art hosted on official CDN.',
    formats: 'json',
    notes: 'URL format: https://cdn.gundam-tcg.official/cards/{cardId}-art.jpg',
    lastValidated: '2024-02-20'
  },

  'seasonal-tournament-coverage': {
    name: 'Seasonal Tournament Coverage',
    type: 'website',
    reliability: 'licensed',
    url: 'https://bandai.official/gundam-tcg/tournaments',
    updateFrequency: 'weekly',
    description: 'Tournament results, banned cards, format announcements.',
    formats: 'html',
    notes: 'Use for legal/banned status and format info. Updated immediately on changes.',
    lastValidated: '2024-02-20'
  }
};

/**
 * SOURCE PRIORITY FOR EACH DATA FIELD
 *
 * Defines which source to favor for each card property.
 */
export const SOURCE_PRIORITY_BY_FIELD = {
  id: ['bandai-official-api', 'bandai-set-releases', 'authorized-companion-app'],
  name: ['bandai-official-api', 'bandai-set-releases', 'authorized-companion-app'],
  nameJP: ['bandai-official-api', 'authorized-companion-app'],
  cost: ['bandai-official-api', 'bandai-set-releases'],
  color: ['bandai-official-api', 'bandai-set-releases'],
  type: ['bandai-official-api', 'bandai-set-releases'],
  power: ['bandai-official-api', 'bandai-set-releases'],
  text: ['bandai-official-api', 'bandai-rulings-database'],
  textJP: ['bandai-official-api'],
  rarity: ['bandai-official-api', 'bandai-set-releases'],
  setCode: ['bandai-official-api', 'bandai-set-releases'],
  releaseDate: ['bandai-official-api', 'bandai-set-releases'],
  artUrl: ['cdn-art-repository', 'bandai-official-api'],
  ruling: ['bandai-rulings-database', 'bandai-official-api'],
  tags: ['community-wiki', 'seasonal-tournament-coverage'],
  legal: ['seasonal-tournament-coverage', 'bandai-official-api'],
  illustrator: ['bandai-official-artbooks', 'bandai-official-api']
} as const;

/**
 * Validation helper: Check if source is official
 */
export const isOfficialSource = (sourceKey: string): boolean => {
  return Object.keys(OFFICIAL_SOURCES).includes(sourceKey);
};

/**
 * Validation helper: Get source reliability tier
 */
export const getSourceTier = (sourceKey: string): number => {
  if (Object.keys(OFFICIAL_SOURCES).includes(sourceKey)) return 1;
  if (Object.keys(LICENSED_SOURCES).includes(sourceKey)) return 2;
  if (Object.keys(COMMUNITY_SOURCES).includes(sourceKey)) return 3;
  if (Object.keys(SUPPLEMENTARY_SOURCES).includes(sourceKey)) return 4;
  return 5; // unknown
};

/**
 * Full source directory (for utilities)
 */
export const ALL_SOURCES = {
  ...OFFICIAL_SOURCES,
  ...LICENSED_SOURCES,
  ...COMMUNITY_SOURCES,
  ...SUPPLEMENTARY_SOURCES
};

/**
 * Schema example for ETL output
 */
export const ETL_SOURCE_METADATA = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  sources: [
    {
      key: 'bandai-official-api',
      name: OFFICIAL_SOURCES['bandai-official-api'].name,
      fetchedAt: new Date().toISOString(),
      cardsCount: 0,
      status: 'pending'
    }
  ],
  changelog: {
    added: 0,
    updated: 0,
    deleted: 0,
    notes: 'Initial seed load'
  },
  compliance: {
    onlyOfficial: false,
    noUnlicensedArt: true,
    properAttribution: true
  }
};
