/**
 * Effect Keyword Database
 * 
 * Categorized list of card effect keywords with aliases and patterns for extraction.
 * Used by search autocomplete, effect pills, and advanced filtering.
 */

export type EffectCategory = 
  | 'draw'
  | 'damage'
  | 'destruction'
  | 'resource'
  | 'search'
  | 'recovery'
  | 'buffs'
  | 'debuffs'
  | 'movement'
  | 'protection'
  | 'cost_reduction';

export interface EffectKeyword {
  /** Primary keyword for display (e.g., "draw", "deal_damage") */
  keyword: string;
  /** Display label for UI (e.g., "Draw", "Deal Damage") */
  label: string;
  /** Category for grouping */
  category: EffectCategory;
  /** Regex patterns to match in card text */
  patterns: RegExp[];
  /** Alternative keywords that map to this effect */
  aliases?: string[];
}

/**
 * Master list of effect keywords
 * Organized by category for autocomplete grouping
 */
export const EFFECT_KEYWORDS: EffectKeyword[] = [
  // --- DRAW EFFECTS ---
  {
    keyword: 'draw',
    label: 'Draw',
    category: 'draw',
    patterns: [/\bdraw\s+\d+/i, /\bdraw\s+a\s+card/i],
    aliases: ['draw_card', 'draw_cards'],
  },

  // --- DAMAGE EFFECTS ---
  {
    keyword: 'deal_damage',
    label: 'Deal Damage',
    category: 'damage',
    patterns: [/\bdeal\s+\d+\s+damage/i, /\bdeals?\s+damage/i, /\bdeal\s+damage/i],
    aliases: ['damage', 'deal', 'direct_damage'],
  },
  {
    keyword: 'damage_all',
    label: 'Damage All',
    category: 'damage',
    patterns: [/\bdeal\s+\d+\s+damage\s+to\s+all/i, /\bdamage\s+to\s+all/i],
    aliases: ['board_damage', 'mass_damage'],
  },

  // --- DESTRUCTION EFFECTS ---
  {
    keyword: 'destroy',
    label: 'Destroy',
    category: 'destruction',
    patterns: [/\bdestroy/i, /\bdestroys/i, /\bdestroyed/i],
    aliases: ['destroy_unit', 'removal'],
  },
  {
    keyword: 'discard',
    label: 'Discard',
    category: 'destruction',
    patterns: [/\bdiscard\s+\d+/i, /\bthen,?\s+discard/i, /\bdiscard\s+a?\s+card/i],
    aliases: ['hand_discard'],
  },

  // --- RESOURCE EFFECTS ---
  {
    keyword: 'place_resource',
    label: 'Place Resource',
    category: 'resource',
    patterns: [/\bplace\s+\d+\s+(rested\s+)?resource/i],
    aliases: ['ramp', 'resource_ramp', 'gain_resource'],
  },
  {
    keyword: '0_cost',
    label: '0 Cost',
    category: 'cost_reduction',
    patterns: [/\b0\s+lv/i, /\b0\s+cost/i, /\bas\s+if\s+it\s+has\s+0/i],
    aliases: ['free_play', 'zero_cost'],
  },

  // --- SEARCH EFFECTS ---
  {
    keyword: 'choose_from_trash',
    label: 'Choose from Trash',
    category: 'search',
    patterns: [/\bchoose\s+\d+\s+card.*from.*trash/i, /\bchoose\s+.*from\s+your\s+trash/i],
    aliases: ['search_trash', 'graveyard_search'],
  },
  {
    keyword: 'look',
    label: 'Look At',
    category: 'search',
    patterns: [/\blook\s+at/i],
    aliases: ['peek', 'scry'],
  },

  // --- RECOVERY EFFECTS ---
  {
    keyword: 'return_to_hand',
    label: 'Return to Hand',
    category: 'recovery',
    patterns: [/\breturn.*to.*owner'?s?\s+hand/i, /\breturn.*to.*hand/i],
    aliases: ['bounce'],
  },
  {
    keyword: 'return_to_deck',
    label: 'Return to Deck',
    category: 'recovery',
    patterns: [/\breturn.*to.*owner'?s?\s+deck/i, /\breturn.*to.*deck/i],
    aliases: ['shuffle_back'],
  },
  {
    keyword: 'choose_from_trash_return',
    label: 'Recover from Trash',
    category: 'recovery',
    patterns: [/\bchoose.*from.*trash.*return/i, /\breturn.*from.*trash/i],
    aliases: ['recursion', 'graveyard_return'],
  },

  // --- COUNTER EFFECTS (not in Gundam TCG, removing) ---

  // --- BUFF EFFECTS ---
  {
    keyword: 'buff_hp',
    label: 'Buff HP',
    category: 'buffs',
    patterns: [/\bhp\+\d+/i, /\bgets?\s+hp\+\d+/i, /\bgains?\s+hp\+\d+/i],
    aliases: ['hp_boost', 'increase_hp'],
  },
  {
    keyword: 'buff_ap',
    label: 'Buff AP',
    category: 'buffs',
    patterns: [/\bap\+\d+/i, /\bgets?\s+ap\+\d+/i, /\bgains?\s+ap\+\d+/i],
    aliases: ['ap_boost', 'increase_ap', 'power_boost'],
  },
  {
    keyword: 'grant_keyword',
    label: 'Grant Keyword',
    category: 'buffs',
    patterns: [/\bgains?\s+<[^>]+>/i, /\bhas\s+<[^>]+>/i, /\ball\s+your.*gain\s+</i],
    aliases: ['give_ability', 'grant_ability'],
  },

  // --- DEBUFF/CONTROL EFFECTS ---
  {
    keyword: 'rest',
    label: 'Rest Unit',
    category: 'debuffs',
    patterns: [/\brest\s+(it|this\s+unit|that\s+unit)/i, /\bchoose.*rest\s+it/i],
    aliases: ['tap', 'exhaust'],
  },

  // --- MOVEMENT/TOKEN EFFECTS ---
  {
    keyword: 'set_active',
    label: 'Set Active',
    category: 'movement',
    patterns: [/\bset.*(as\s+)?active/i, /\bset\s+this\s+unit\s+as\s+active/i],
    aliases: ['untap', 'wake'],
  },
  {
    keyword: 'deploy_token',
    label: 'Deploy Token',
    category: 'movement',
    patterns: [/\bdeploy\s+\d+.*token/i, /\bcreate.*token/i],
    aliases: ['create_token', 'token'],
  },
  {
    keyword: 'pair',
    label: 'Pair Unit',
    category: 'movement',
    patterns: [/\bpair\s+it\s+with/i, /\bpaired\s+with/i],
    aliases: ['link'],
  },

  // --- PROTECTION EFFECTS ---
  {
    keyword: 'cant_be_destroyed',
    label: "Can't be Destroyed",
    category: 'protection',
    patterns: [/\bcan'?t\s+be\s+destroyed/i, /\bcannot\s+be\s+destroyed/i],
    aliases: ['indestructible', 'protection'],
  },
  {
    keyword: 'cant_be_blocked',
    label: "Can't be Blocked",
    category: 'protection',
    patterns: [/\bcan'?t\s+be\s+blocked/i, /\bcannot\s+be\s+blocked/i],
    aliases: ['evasion', 'unblockable'],
  },
];

/**
 * Build keyword lookup index for fast searching
 */
export const EFFECT_KEYWORD_MAP = new Map(
  EFFECT_KEYWORDS.map(ek => [ek.keyword, ek])
);

/**
 * Build alias lookup map (alias -> primary keyword)
 */
export const EFFECT_ALIAS_MAP = new Map<string, string>(
  EFFECT_KEYWORDS.flatMap(ek => 
    (ek.aliases ?? []).map(alias => [alias, ek.keyword])
  )
);

/**
 * Get effect keyword by name (supports aliases)
 */
export function getEffectKeyword(keyword: string): EffectKeyword | undefined {
  // Check primary keyword first
  const primary = EFFECT_KEYWORD_MAP.get(keyword);
  if (primary) return primary;
  
  // Check aliases
  const primaryKeyword = EFFECT_ALIAS_MAP.get(keyword);
  if (primaryKeyword) return EFFECT_KEYWORD_MAP.get(primaryKeyword);
  
  return undefined;
}

/**
 * Get all effects in a category
 */
export function getEffectsByCategory(category: EffectCategory): EffectKeyword[] {
  return EFFECT_KEYWORDS.filter(ek => ek.category === category);
}

/**
 * Get all unique categories
 */
export const EFFECT_CATEGORIES: EffectCategory[] = [
  'draw',
  'damage',
  'destruction',
  'resource',
  'search',
  'recovery',
  'buffs',
  'debuffs',
  'movement',
  'protection',
  'cost_reduction',
];

/**
 * Category display labels for UI
 */
export const CATEGORY_LABELS: Record<EffectCategory, string> = {
  draw: 'Draw',
  damage: 'Damage',
  destruction: 'Destruction',
  resource: 'Resource',
  search: 'Search',
  recovery: 'Recovery',
  buffs: 'Buffs',
  debuffs: 'Debuffs',
  movement: 'Movement',
  protection: 'Protection',
  cost_reduction: 'Cost Reduction',
};
