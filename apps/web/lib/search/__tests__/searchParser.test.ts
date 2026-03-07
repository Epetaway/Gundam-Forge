/**
 * Search Parser Test Suite
 * 
 * Tests for query parsing with AND/OR/negation/exact phrase support
 */

import { describe, it, expect } from 'vitest';
import {
  parseSearchQuery,
  hasTerms,
  getPositiveTerms,
  getNegatedTerms,
  formatParsedQuery,
  termMatchesText,
  type SearchTerm,
} from '../searchParser';

describe('parseSearchQuery', () => {
  it('should parse empty query', () => {
    const result = parseSearchQuery('');
    expect(result.isEmpty).toBe(true);
    expect(result.clauses).toHaveLength(0);
  });

  it('should parse single term', () => {
    const result = parseSearchQuery('draw');
    expect(result.isEmpty).toBe(false);
    expect(result.clauses).toHaveLength(1);
    expect(result.clauses[0].terms).toHaveLength(1);
    expect(result.clauses[0].terms[0].value).toBe('draw');
    expect(result.clauses[0].terms[0].negated).toBe(false);
    expect(result.clauses[0].terms[0].exact).toBe(false);
  });

  it('should parse multiple terms (implicit AND)', () => {
    const result = parseSearchQuery('draw trash');
    expect(result.clauses).toHaveLength(1);
    expect(result.clauses[0].terms).toHaveLength(2);
    expect(result.clauses[0].terms[0].value).toBe('draw');
    expect(result.clauses[0].terms[1].value).toBe('trash');
    expect(result.clauses[0].operator).toBe('AND');
  });

  it('should parse OR operator', () => {
    const result = parseSearchQuery('draw | trash');
    expect(result.clauses).toHaveLength(2);
    expect(result.clauses[0].terms[0].value).toBe('draw');
    expect(result.clauses[1].terms[0].value).toBe('trash');
  });

  it('should parse negated terms', () => {
    const result = parseSearchQuery('draw -destroy');
    expect(result.clauses[0].terms).toHaveLength(2);
    expect(result.clauses[0].terms[0].value).toBe('draw');
    expect(result.clauses[0].terms[0].negated).toBe(false);
    expect(result.clauses[0].terms[1].value).toBe('destroy');
    expect(result.clauses[0].terms[1].negated).toBe(true);
  });

  it('should parse exact phrases', () => {
    const result = parseSearchQuery('"deal 2 damage"');
    expect(result.clauses[0].terms).toHaveLength(1);
    expect(result.clauses[0].terms[0].value).toBe('deal 2 damage');
    expect(result.clauses[0].terms[0].exact).toBe(true);
  });

  it('should parse complex query with multiple operators', () => {
    const result = parseSearchQuery('draw -destroy | "deal 2 damage"');
    expect(result.clauses).toHaveLength(2);
    
    // First clause: draw -destroy
    expect(result.clauses[0].terms).toHaveLength(2);
    expect(result.clauses[0].terms[0].value).toBe('draw');
    expect(result.clauses[0].terms[0].negated).toBe(false);
    expect(result.clauses[0].terms[1].value).toBe('destroy');
    expect(result.clauses[0].terms[1].negated).toBe(true);
    
    // Second clause: "deal 2 damage"
    expect(result.clauses[1].terms).toHaveLength(1);
    expect(result.clauses[1].terms[0].value).toBe('deal 2 damage');
    expect(result.clauses[1].terms[0].exact).toBe(true);
  });

  it('should handle extra whitespace', () => {
    const result = parseSearchQuery('  draw   trash  ');
    expect(result.clauses[0].terms).toHaveLength(2);
    expect(result.clauses[0].terms[0].value).toBe('draw');
    expect(result.clauses[0].terms[1].value).toBe('trash');
  });

  it('should handle multiple exact phrases', () => {
    const result = parseSearchQuery('"deal damage" "draw cards"');
    expect(result.clauses[0].terms).toHaveLength(2);
    expect(result.clauses[0].terms[0].value).toBe('deal damage');
    expect(result.clauses[0].terms[0].exact).toBe(true);
    expect(result.clauses[0].terms[1].value).toBe('draw cards');
    expect(result.clauses[0].terms[1].exact).toBe(true);
  });
});

describe('hasTerms', () => {
  it('should return false for empty query', () => {
    const parsed = parseSearchQuery('');
    expect(hasTerms(parsed)).toBe(false);
  });

  it('should return true for non-empty query', () => {
    const parsed = parseSearchQuery('draw');
    expect(hasTerms(parsed)).toBe(true);
  });
});

describe('getPositiveTerms', () => {
  it('should extract positive terms', () => {
    const parsed = parseSearchQuery('draw trash -destroy');
    const terms = getPositiveTerms(parsed);
    expect(terms).toContain('draw');
    expect(terms).toContain('trash');
    expect(terms).not.toContain('destroy');
  });

  it('should deduplicate terms', () => {
    const parsed = parseSearchQuery('draw draw');
    const terms = getPositiveTerms(parsed);
    expect(terms).toHaveLength(1);
    expect(terms[0]).toBe('draw');
  });
});

describe('getNegatedTerms', () => {
  it('should extract negated terms', () => {
    const parsed = parseSearchQuery('draw -destroy -trash');
    const terms = getNegatedTerms(parsed);
    expect(terms).toContain('destroy');
    expect(terms).toContain('trash');
    expect(terms).not.toContain('draw');
  });
});

describe('formatParsedQuery', () => {
  it('should format simple query', () => {
    const parsed = parseSearchQuery('draw trash');
    const formatted = formatParsedQuery(parsed);
    expect(formatted).toBe('draw trash');
  });

  it('should format negated terms', () => {
    const parsed = parseSearchQuery('draw -destroy');
    const formatted = formatParsedQuery(parsed);
    expect(formatted).toBe('draw -destroy');
  });

  it('should format exact phrases', () => {
    const parsed = parseSearchQuery('"deal 2 damage"');
    const formatted = formatParsedQuery(parsed);
    expect(formatted).toBe('"deal 2 damage"');
  });

  it('should format OR queries', () => {
    const parsed = parseSearchQuery('draw | trash');
    const formatted = formatParsedQuery(parsed);
    expect(formatted).toBe('draw | trash');
  });
});

describe('termMatchesText', () => {
  it('should match partial terms with word boundaries', () => {
    const term: SearchTerm = { value: 'draw', negated: false, exact: false };
    expect(termMatchesText(term, 'Draw 2 cards')).toBe(true);
    expect(termMatchesText(term, 'withdraw')).toBe(false);
  });

  it('should match exact phrases', () => {
    const term: SearchTerm = { value: 'deal 2 damage', negated: false, exact: true };
    expect(termMatchesText(term, 'Deal 2 damage to target')).toBe(true);
    expect(termMatchesText(term, 'Deal damage')).toBe(false);
  });

  it('should be case insensitive', () => {
    const term: SearchTerm = { value: 'DRAW', negated: false, exact: false };
    expect(termMatchesText(term, 'draw 2 cards')).toBe(true);
  });

  it('should handle special characters with exact match', () => {
    const term: SearchTerm = { value: '<Repair 2>', negated: false, exact: true };
    expect(termMatchesText(term, 'This unit has <Repair 2> while paired')).toBe(true);
  });
});
