import type { CardColor, CardType } from '@gundam-forge/shared';
import type { CardDeckRole, FilterMatchMode } from '@/lib/filters/cardFilters';

export const KEYWORD_OPTIONS = ['All', 'Rush', 'Breach', 'Burst', 'Suppression', 'Repair', 'Support', 'Link', 'Pair'] as const;
export type KeywordOption = typeof KEYWORD_OPTIONS[number];
export type CardsPresetId = 'rush-main' | 'resource-core' | 'control-commands';

export interface CardsFilterDraft {
  query: string;
  color: CardColor | 'All';
  selectedColors: CardColor[];
  type: CardType | 'All';
  setCode: string;
  keyword: KeywordOption;
  zone: string;
  deckRole: CardDeckRole | 'All';
  matchMode: FilterMatchMode;
  clans: string[];
  traits: string[];
  mechanics: string[];
  triggers: string[];
}

export function countDraftSelections(draft: CardsFilterDraft): number {
  let count = 0;
  if (draft.query.trim().length > 0) count += 1;
  if (draft.type !== 'All') count += 1;
  if (draft.setCode !== 'All') count += 1;
  if (draft.keyword !== 'All') count += 1;
  if (draft.zone !== 'All') count += 1;
  if (draft.deckRole !== 'All') count += 1;
  if (draft.matchMode === 'broad') count += 1;
  count += draft.selectedColors.length;
  count += draft.clans.length;
  count += draft.traits.length;
  count += draft.mechanics.length;
  count += draft.triggers.length;
  return count;
}

export function areDraftFiltersEqual(left: CardsFilterDraft, right: CardsFilterDraft): boolean {
  return (
    left.query === right.query &&
    left.color === right.color &&
    left.type === right.type &&
    left.setCode === right.setCode &&
    left.keyword === right.keyword &&
    left.zone === right.zone &&
    left.deckRole === right.deckRole &&
    left.matchMode === right.matchMode &&
    JSON.stringify(left.selectedColors) === JSON.stringify(right.selectedColors) &&
    JSON.stringify(left.clans) === JSON.stringify(right.clans) &&
    JSON.stringify(left.traits) === JSON.stringify(right.traits) &&
    JSON.stringify(left.mechanics) === JSON.stringify(right.mechanics) &&
    JSON.stringify(left.triggers) === JSON.stringify(right.triggers)
  );
}

export function applyCardsMobilePreset(draft: CardsFilterDraft, preset: CardsPresetId): CardsFilterDraft {
  if (preset === 'rush-main') {
    return {
      ...draft,
      keyword: 'Rush',
      deckRole: 'main',
      type: 'Unit',
      matchMode: 'strict',
    };
  }

  if (preset === 'resource-core') {
    return {
      ...draft,
      deckRole: 'resource',
      type: 'Resource',
      keyword: 'All',
      matchMode: 'strict',
    };
  }

  return {
    ...draft,
    type: 'Command',
    deckRole: 'All',
    keyword: 'Suppression',
    matchMode: 'broad',
  };
}