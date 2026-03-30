import { describe, it, expect } from 'vitest';
import { isExCard, isResourceCard, isMainDeckCard } from '../src/cardClassification';
import type { CardDefinition } from '../src/types';

function makeCard(overrides: Partial<CardDefinition> & { id: string }): CardDefinition {
  return {
    name: overrides.id,
    color: 'Blue',
    cost: 2,
    type: 'Unit',
    set: 'TEST-1',
    ...overrides,
  };
}

describe('isExCard', () => {
  it('returns true when isExCard flag is true', () => {
    expect(isExCard(makeCard({ id: 'card-1', isExCard: true }))).toBe(true);
  });

  it('returns false when isExCard flag is false', () => {
    expect(isExCard(makeCard({ id: 'card-1', isExCard: false }))).toBe(false);
  });

  it('returns true when traits include "ex"', () => {
    expect(isExCard(makeCard({ id: 'card-1', traits: ['EX Base'] }))).toBe(true);
  });

  it('returns false when "ex" is only a substring of a trait word', () => {
    expect(isExCard(makeCard({ id: 'card-1', traits: ['Next Generation'] }))).toBe(false);
    expect(isExCard(makeCard({ id: 'card-1', traits: ['Flexible'] }))).toBe(false);
  });

  it('returns true when id starts with "ex"', () => {
    expect(isExCard(makeCard({ id: 'EX-001' }))).toBe(true);
  });

  it('returns false for a normal Unit card', () => {
    expect(isExCard(makeCard({ id: 'GD01-001', type: 'Unit' }))).toBe(false);
  });
});

describe('isResourceCard', () => {
  it('returns true when isResource flag is true', () => {
    expect(isResourceCard(makeCard({ id: 'res-1', isResource: true }))).toBe(true);
  });

  it('returns false when isResource flag is false', () => {
    expect(isResourceCard(makeCard({ id: 'res-1', isResource: false }))).toBe(false);
  });

  it('returns true for Resource type cards', () => {
    expect(isResourceCard(makeCard({ id: 'res-1', type: 'Resource' }))).toBe(true);
  });

  it('returns false for Base type cards', () => {
    expect(isResourceCard(makeCard({ id: 'base-1', type: 'Base' }))).toBe(false);
  });

  it('returns false for Unit type cards', () => {
    expect(isResourceCard(makeCard({ id: 'unit-1', type: 'Unit' }))).toBe(false);
  });

  it('returns false for Command type cards', () => {
    expect(isResourceCard(makeCard({ id: 'cmd-1', type: 'Command' }))).toBe(false);
  });
});

describe('isMainDeckCard', () => {
  it('returns true when isMainDeck flag is true', () => {
    expect(isMainDeckCard(makeCard({ id: 'main-1', isMainDeck: true }))).toBe(true);
  });

  it('returns false when isMainDeck flag is false', () => {
    expect(isMainDeckCard(makeCard({ id: 'main-1', isMainDeck: false }))).toBe(false);
  });

  it('returns true for Unit type', () => {
    expect(isMainDeckCard(makeCard({ id: 'unit-1', type: 'Unit' }))).toBe(true);
  });

  it('returns true for Pilot type', () => {
    expect(isMainDeckCard(makeCard({ id: 'pilot-1', type: 'Pilot' }))).toBe(true);
  });

  it('returns true for Command type', () => {
    expect(isMainDeckCard(makeCard({ id: 'cmd-1', type: 'Command' }))).toBe(true);
  });

  it('returns false for Resource type', () => {
    expect(isMainDeckCard(makeCard({ id: 'res-1', type: 'Resource' }))).toBe(false);
  });

  it('returns true for Base type', () => {
    expect(isMainDeckCard(makeCard({ id: 'base-1', type: 'Base' }))).toBe(true);
  });

  it('returns false for EX cards (Unit with EX trait)', () => {
    expect(isMainDeckCard(makeCard({ id: 'EX-001', type: 'Unit' }))).toBe(false);
  });

  it('returns false for EX cards (via traits)', () => {
    expect(isMainDeckCard(makeCard({ id: 'card-1', type: 'Unit', traits: ['EX Base'] }))).toBe(false);
  });
});

describe('consistency: all three functions partition the card space', () => {
  const mainUnit = makeCard({ id: 'GD01-001', type: 'Unit' });
  const mainPilot = makeCard({ id: 'GD01-002', type: 'Pilot' });
  const mainCommand = makeCard({ id: 'GD01-003', type: 'Command' });
  const resource = makeCard({ id: 'RES-001', type: 'Resource' });
  const base = makeCard({ id: 'BASE-001', type: 'Base' });
  const exCard = makeCard({ id: 'EX-001', type: 'Unit', traits: ['EX Base'] });

  it('main deck cards are not resource cards', () => {
    for (const card of [mainUnit, mainPilot, mainCommand]) {
      expect(isMainDeckCard(card)).toBe(true);
      expect(isResourceCard(card)).toBe(false);
    }
  });

  it('resource cards are not main deck cards', () => {
    expect(isResourceCard(resource)).toBe(true);
    expect(isMainDeckCard(resource)).toBe(false);
  });

  it('base cards are main deck cards, not resource cards', () => {
    expect(isMainDeckCard(base)).toBe(true);
    expect(isResourceCard(base)).toBe(false);
  });

  it('EX cards are not main deck cards', () => {
    expect(isExCard(exCard)).toBe(true);
    expect(isMainDeckCard(exCard)).toBe(false);
  });
});
