import { describe, expect, it } from 'vitest';
import { applyCardsMobilePreset, areDraftFiltersEqual, countDraftSelections, type CardsFilterDraft } from '@/lib/filters/cardsUxV2';

function makeDraft(overrides: Partial<CardsFilterDraft> = {}): CardsFilterDraft {
  return {
    query: '',
    color: 'All',
    selectedColors: [],
    type: 'All',
    setCode: 'All',
    keyword: 'All',
    zone: 'All',
    deckRole: 'All',
    matchMode: 'strict',
    clans: [],
    traits: [],
    mechanics: [],
    triggers: [],
    ...overrides,
  };
}

describe('cardsUxV2 helpers', () => {
  it('counts selected draft filters', () => {
    const count = countDraftSelections(
      makeDraft({
        query: 'char',
        selectedColors: ['Red', 'Blue'],
        type: 'Unit',
        deckRole: 'main',
        clans: ['Zeon'],
      }),
    );

    expect(count).toBe(6);
  });

  it('applies rush-main preset', () => {
    const result = applyCardsMobilePreset(makeDraft(), 'rush-main');
    expect(result.keyword).toBe('Rush');
    expect(result.deckRole).toBe('main');
    expect(result.type).toBe('Unit');
    expect(result.matchMode).toBe('strict');
  });

  it('applies resource-core and control-commands presets', () => {
    const resource = applyCardsMobilePreset(makeDraft({ keyword: 'Rush' }), 'resource-core');
    expect(resource.deckRole).toBe('resource');
    expect(resource.type).toBe('Resource');
    expect(resource.keyword).toBe('All');

    const control = applyCardsMobilePreset(makeDraft(), 'control-commands');
    expect(control.type).toBe('Command');
    expect(control.keyword).toBe('Suppression');
    expect(control.matchMode).toBe('broad');
  });

  it('detects draft sync equality correctly', () => {
    const base = makeDraft({
      query: 'char',
      selectedColors: ['Red'],
      clans: ['Zeon'],
    });

    expect(areDraftFiltersEqual(base, makeDraft({ query: 'char', selectedColors: ['Red'], clans: ['Zeon'] }))).toBe(true);
    expect(areDraftFiltersEqual(base, makeDraft({ query: 'char', selectedColors: ['Blue'], clans: ['Zeon'] }))).toBe(false);
  });

  it('treats list ordering as significant for sync checks', () => {
    const left = makeDraft({ selectedColors: ['Blue', 'Red'], clans: ['Zeon', 'Neo Zeon'] });
    const right = makeDraft({ selectedColors: ['Red', 'Blue'], clans: ['Neo Zeon', 'Zeon'] });
    expect(areDraftFiltersEqual(left, right)).toBe(false);
  });

  it('counts broad mode as an active draft selection', () => {
    const count = countDraftSelections(makeDraft({ matchMode: 'broad' }));
    expect(count).toBe(1);
  });
});