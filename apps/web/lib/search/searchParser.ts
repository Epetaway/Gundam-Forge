/**
 * Search Query Parser
 * 
 * Parses user search queries into structured format with support for:
 * - Multiple terms (implicit AND)
 * - OR logic (|)
 * - Negation (-)
 * - Exact phrases ("")
 * 
 * Examples:
 * - "draw trash" → AND(draw, trash)
 * - "draw | trash" → OR(draw, trash)
 * - "draw -destroy" → AND(draw, NOT(destroy))
 * - '"deal 2 damage"' → EXACT("deal 2 damage")
 */

export type SearchTerm = {
  /** The search term text */
  value: string;
  /** Whether this term is negated (excluded) */
  negated: boolean;
  /** Whether this is an exact phrase match */
  exact: boolean;
};

export type SearchOperator = 'AND' | 'OR';

export type SearchClause = {
  /** Search terms in this clause */
  terms: SearchTerm[];
  /** Operator connecting terms (default: AND) */
  operator: SearchOperator;
};

export type ParsedQuery = {
  /** Original query string */
  original: string;
  /** Parsed search clauses */
  clauses: SearchClause[];
  /** Whether the query is empty */
  isEmpty: boolean;
};

/**
 * Parse a search query into structured format
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const original = query;
  const trimmed = query.trim();
  
  if (!trimmed) {
    return {
      original,
      clauses: [],
      isEmpty: true,
    };
  }

  // Extract exact phrases first (preserve them as single terms)
  const exactPhrases: string[] = [];
  let workingQuery = trimmed;
  
  // Match quoted phrases
  const quoteRegex = /"([^"]+)"/g;
  let match;
  while ((match = quoteRegex.exec(trimmed)) !== null) {
    const phrase = match[1];
    const placeholder = `__EXACT_${exactPhrases.length}__`;
    exactPhrases.push(phrase);
    workingQuery = workingQuery.replace(match[0], placeholder);
  }

  // Split by OR operator (|)
  const orClauses = workingQuery.split('|').map(s => s.trim()).filter(Boolean);
  
  const clauses: SearchClause[] = orClauses.map(clauseText => {
    // Split by whitespace for AND terms
    const tokens = clauseText.split(/\s+/).filter(Boolean);
    
    const terms: SearchTerm[] = tokens.map(token => {
      let value = token;
      let negated = false;
      let exact = false;
      
      // Check for negation
      if (value.startsWith('-')) {
        negated = true;
        value = value.slice(1);
      }
      
      // Check if this is an exact phrase placeholder
      if (value.startsWith('__EXACT_')) {
        const index = parseInt(value.match(/__EXACT_(\d+)__/)?.[1] ?? '0', 10);
        value = exactPhrases[index] ?? value;
        exact = true;
      }
      
      return { value, negated, exact };
    });
    
    return {
      terms,
      operator: 'AND' as SearchOperator,
    };
  });

  return {
    original,
    clauses,
    isEmpty: false,
  };
}

/**
 * Check if a parsed query contains any terms
 */
export function hasTerms(parsed: ParsedQuery): boolean {
  return !parsed.isEmpty && parsed.clauses.some(c => c.terms.length > 0);
}

/**
 * Get all unique terms from a parsed query (excluding negated terms)
 */
export function getPositiveTerms(parsed: ParsedQuery): string[] {
  const terms = new Set<string>();
  
  for (const clause of parsed.clauses) {
    for (const term of clause.terms) {
      if (!term.negated) {
        terms.add(term.value.toLowerCase());
      }
    }
  }
  
  return Array.from(terms);
}

/**
 * Get all negated terms from a parsed query
 */
export function getNegatedTerms(parsed: ParsedQuery): string[] {
  const terms = new Set<string>();
  
  for (const clause of parsed.clauses) {
    for (const term of clause.terms) {
      if (term.negated) {
        terms.add(term.value.toLowerCase());
      }
    }
  }
  
  return Array.from(terms);
}

/**
 * Format a parsed query back into readable string (for debugging)
 */
export function formatParsedQuery(parsed: ParsedQuery): string {
  if (parsed.isEmpty) return '';
  
  return parsed.clauses.map(clause => {
    const termStrings = clause.terms.map(term => {
      let str = term.value;
      if (term.exact) str = `"${str}"`;
      if (term.negated) str = `-${str}`;
      return str;
    });
    return termStrings.join(' ');
  }).join(' | ');
}

/**
 * Normalize search term for matching (lowercase, trim)
 */
export function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim();
}

/**
 * Check if a haystack contains a search term
 */
export function termMatchesText(term: SearchTerm, haystack: string): boolean {
  const normalizedHaystack = haystack.toLowerCase();
  const normalizedTerm = term.value.toLowerCase();
  
  if (term.exact) {
    // Exact phrase match
    return normalizedHaystack.includes(normalizedTerm);
  } else {
    // Partial word match with word boundaries
    // e.g., "draw" matches "Draw 2 cards" but not "withdraw"
    const wordBoundaryRegex = new RegExp(`\\b${escapeRegExp(normalizedTerm)}`, 'i');
    return wordBoundaryRegex.test(normalizedHaystack);
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
