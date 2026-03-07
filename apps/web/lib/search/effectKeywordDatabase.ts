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
  | 'counters'
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
    patterns: [/\bdraw\s+\d+/i, /\bdraw\s+a\s+card/i, /\bdraw\s+cards/i],
    aliases: ['draw_card', 'draw_cards'],
  },

  // --- DAMAGE EFFECTS ---
  {
    keyword: 'deal_damage',
    label: 'Deal Damage',
    category: 'damage',
    patterns: [/\bdeal\s+\d+\s+damage/i, /\bdeals?\s+\d+\s+damage/i],
    aliases: ['damage', 'deal', 'direct_damage'],
  },
  {
    keyword: 'combat_damage',
    label: 'Combat Damage',
    category: 'damage',
    patterns: [/\bcombat\s+damage/i, /\bin\s+combat/i],
    aliases: ['battle_damage'],
  },
  {
    keyword: 'burn',
    label: 'Burn',
    category: 'damage',
    patterns: [/\bburn\s+\d+/i],
  },

  // --- DESTRUCTION EFFECTS ---
  {
    keyword: 'destroy',
    label: 'Destroy',
    category: 'destruction',
    patterns: [/\bdestroy\s+(target|a|that|all|up\s+to)/i, /\bis\s+destroyed/i],
    aliases: ['destroy_card', 'remove'],
  },
  {
    keyword: 'trash',
    label: 'Trash',
    category: 'destruction',
    patterns: [/\btrash\s+(target|a|that|all|this|it)/i, /\bis\s+trashed/i, /\binto\s+the\s+trash/i],
    aliases: ['discard', 'trash_card', 'send_to_trash'],
  },
  {
    keyword: 'exile',
    label: 'Exile',
    category: 'destruction',
    patterns: [/\bexile\s+(target|a|that|all)/i, /\bis\s+exiled/i],
    aliases: ['banish', 'remove_from_game'],
  },

  // --- RESOURCE EFFECTS ---
  {
    keyword: 'gain_g',
    label: 'Gain G',
    category: 'resource',
    patterns: [/\bgain\s+\d+\s+【G】/i, /\bgains?\s+\d+\s+【G】/i],
    aliases: ['gain_resource', 'ramp', 'resource_gain'],
  },
  {
    keyword: 'reduce_cost',
    label: 'Reduce Cost',
    category: 'cost_reduction',
    patterns: [/\bcosts?\s+\d+\s+less/i, /\breduce.*cost/i, /\bcost\s+reduction/i],
    aliases: ['cost_reduction', 'cheaper'],
  },
  {
    keyword: 'free_play',
    label: 'Free Play',
    category: 'cost_reduction',
    patterns: [/\bwithout\s+paying.*cost/i, /\bfor\s+free/i],
    aliases: ['play_free', 'no_cost'],
  },

  // --- SEARCH EFFECTS ---
  {
    keyword: 'search',
    label: 'Search',
    category: 'search',
    patterns: [/\bsearch\s+your\s+(deck|library|hand)/i, /\bsearches?\s+for/i],
    aliases: ['search_deck', 'tutor'],
  },
  {
    keyword: 'reveal',
    label: 'Reveal',
    category: 'search',
    patterns: [/\breveal\s+(the|a|cards?|top)/i],
  },
  {
    keyword: 'look_at',
    label: 'Look At',
    category: 'search',
    patterns: [/\blook\s+at\s+(the|your|top)/i],
    aliases: ['scry', 'peek'],
  },

  // --- RECOVERY EFFECTS ---
  {
    keyword: 'recover',
    label: 'Recover',
    category: 'recovery',
    patterns: [/\brecover\s+\d+/i, /\brecovers?\s+\d+/i],
    aliases: ['heal', 'gain_life', 'life_gain'],
  },
  {
    keyword: 'return_from_trash',
    label: 'Return from Trash',
    category: 'recovery',
    patterns: [/\breturn.*from.*trash/i, /\breturn.*from.*graveyard/i],
    aliases: ['reanimate', 'recursion', 'return'],
  },
  {
    keyword: 'return_to_hand',
    label: 'Return to Hand',
    category: 'recovery',
    patterns: [/\breturn.*to.*hand/i, /\breturn.*to\s+(its|your|their)\s+owner's\s+hand/i],
    aliases: ['bounce', 'return'],
  },
  {
    keyword: 'return_to_deck',
    label: 'Return to Deck',
    category: 'recovery',
    patterns: [/\breturn.*to.*deck/i, /\bshuffle.*into.*deck/i],
    aliases: ['shuffle_back'],
  },

  // --- COUNTER EFFECTS ---
  {
    keyword: 'add_counters',
    label: 'Add Counters',
    category: 'counters',
    patterns: [/\bput\s+\d+.*counter/i, /\badd\s+\d+.*counter/i],
    aliases: ['counter', 'plus_counter'],
  },
  {
    keyword: 'remove_counters',
    label: 'Remove Counters',
    category: 'counters',
    patterns: [/\bremove\s+\d+.*counter/i, /\btake\s+off.*counter/i],
    aliases: ['minus_counter'],
  },

  // --- BUFF EFFECTS ---
  {
    keyword: 'buff_power',
    label: 'Buff Power',
    category: 'buffs',
    patterns: [/\bgets?\s+\+\d+\/\+\d+/i, /\bgain\s+\+\d+\s+power/i, /\bpower\s+increases?/i],
    aliases: ['pump', 'boost', 'power_boost'],
  },
  {
    keyword: 'grant_keyword',
    label: 'Grant Keyword',
    category: 'buffs',
    patterns: [/\bgains?\s+<[^>]+>/i, /\bhas\s+<[^>]+>/i],
    aliases: ['give_ability', 'grant_ability'],
  },

  // --- DEBUFF EFFECTS ---
  {
    keyword: 'debuff_power',
    label: 'Debuff Power',
    category: 'debuffs',
    patterns: [/\bgets?\s+-\d+\/-\d+/i, /\blose\s+\d+\s+power/i, /\bpower\s+decreases?/i],
    aliases: ['weaken', 'shrink'],
  },
  {
    keyword: 'cannot_attack',
    label: 'Cannot Attack',
    category: 'debuffs',
    patterns: [/\bcannot\s+attack/i, /\bcan't\s+attack/i],
    aliases: ['prevent_attack', 'disable'],
  },
  {
    keyword: 'cannot_block',
    label: 'Cannot Block',
    category: 'debuffs',
    patterns: [/\bcannot\s+block/i, /\bcan't\s+block/i],
    aliases: ['prevent_block'],
  },

  // --- MOVEMENT EFFECTS ---
  {
    keyword: 'move_zone',
    label: 'Move Zone',
    category: 'movement',
    patterns: [/\bmove.*to\s+(battlefield|hand|deck|trash)/i],
    aliases: ['relocate'],
  },
  {
    keyword: 'swap_zones',
    label: 'Swap Zones',
    category: 'movement',
    patterns: [/\bswap\s+(their|its)\s+(positions?|zones?)/i, /\bexchange/i],
    aliases: ['exchange'],
  },

  // --- PROTECTION EFFECTS ---
  {
    keyword: 'indestructible',
    label: 'Indestructible',
    category: 'protection',
    patterns: [/\bcan'?t\s+be\s+destroyed/i, /\bcannot\s+be\s+destroyed/i, /\bindestructible/i],
    aliases: ['protection', 'immune'],
  },
  {
    keyword: 'hexproof',
    label: 'Hexproof',
    category: 'protection',
    patterns: [/\bcan'?t\s+be\s+targeted/i, /\bcannot\s+be\s+targeted/i, /\bhexproof/i],
    aliases: ['untargetable', 'shroud'],
  },
  {
    keyword: 'prevent_damage',
    label: 'Prevent Damage',
    category: 'protection',
    patterns: [/\bprevent.*damage/i, /\bdamage.*prevented/i],
    aliases: ['damage_prevention'],
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
  'counters',
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
  counters: 'Counters',
  buffs: 'Buffs',
  debuffs: 'Debuffs',
  movement: 'Movement',
  protection: 'Protection',
  cost_reduction: 'Cost Reduction',
};
