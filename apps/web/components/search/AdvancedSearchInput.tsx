'use client';

/**
 * Advanced Search Input
 * 
 * Enhanced search input with autocomplete, effect pills, and keyboard navigation.
 * Integrates SearchSuggestionDropdown for autocomplete functionality.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { SearchSuggestionDropdown, useSuggestionNavigation } from './SearchSuggestionDropdown';
import { generateSearchSuggestions, type SuggestionGroup } from '@/lib/search/searchSuggestions';
import type { CardDefinition } from '@gundam-forge/shared';

export interface AdvancedSearchInputProps {
  /** Search query value */
  value: string;
  /** Callback when query changes */
  onChange: (value: string) => void;
  /** All cards for suggestion generation */
  cards: CardDefinition[];
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay for suggestions (ms) */
  debounceMs?: number;
  /** Whether to show search syntax help */
  showHelp?: boolean;
  /** Additional class names */
  className?: string;
}

export function AdvancedSearchInput({
  value,
  onChange,
  cards,
  placeholder = 'Search cards... (try "draw", "Zeon", or "deal damage")',
  debounceMs = 200,
  showHelp = false,
  className = '',
}: AdvancedSearchInputProps) {
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Calculate total suggestions count for keyboard navigation
  const suggestionsCount = suggestions.reduce(
    (total, group) => total + group.suggestions.length,
    0
  );

  const { selectedIndex, setSelectedIndex, handleKeyDown } = useSuggestionNavigation(
    suggestionsCount,
    isDropdownOpen
  );

  // Generate suggestions with debounce
  const updateSuggestions = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!query.trim()) {
        setSuggestions([]);
        setIsDropdownOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      debounceTimerRef.current = setTimeout(() => {
        const newSuggestions = generateSearchSuggestions(query, cards, {
          maxPerCategory: 5,
          includeCards: true,
          includeEffects: true,
          includeClans: true,
        });

        setSuggestions(newSuggestions);
        setIsDropdownOpen(newSuggestions.length > 0);
        setIsLoading(false);
      }, debounceMs);
    },
    [cards, debounceMs]
  );

  // Update suggestions when value changes
  useEffect(() => {
    updateSuggestions(value);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, updateSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionSelect = (suggestionValue: string) => {
    // Append suggestion to existing query
    const trimmed = value.trim();
    const newValue = trimmed ? `${trimmed} ${suggestionValue}` : suggestionValue;
    onChange(newValue);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    
    // Focus back on input
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e);

    if (e.key === 'Enter' && isDropdownOpen && selectedIndex >= 0) {
      e.preventDefault();
      // Find the selected suggestion
      let currentIndex = 0;
      for (const group of suggestions) {
        for (const suggestion of group.suggestions) {
          if (currentIndex === selectedIndex) {
            handleSuggestionSelect(suggestion.value);
            return;
          }
          currentIndex++;
        }
      }
    }
  };

  const handleClear = () => {
    onChange('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-surface-800 border border-steel-700 rounded-lg text-steel-100 placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
          aria-label="Search cards"
          aria-autocomplete="list"
          aria-controls={isDropdownOpen ? 'search-suggestions' : undefined}
          aria-expanded={isDropdownOpen}
          autoComplete="off"
        />

        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-steel-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-steel-500 hover:text-steel-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      <SearchSuggestionDropdown
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        onSelect={handleSuggestionSelect}
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        isLoading={isLoading}
      />

      {/* Search Syntax Help */}
      {showHelp && (
        <div className="mt-2 p-3 bg-surface-900 border border-steel-800 rounded text-xs text-steel-400 space-y-1">
          <div><strong className="text-steel-300">Search Tips:</strong></div>
          <div>• Multiple terms: <code className="text-cobalt-400">draw trash</code> (finds cards with BOTH)</div>
          <div>• OR logic: <code className="text-cobalt-400">draw | trash</code> (finds cards with EITHER)</div>
          <div>• Exclude: <code className="text-cobalt-400">draw -destroy</code> (draw but NOT destroy)</div>
          <div>• Exact phrase: <code className="text-cobalt-400">"deal 2 damage"</code> (exact match)</div>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified search input without autocomplete (for basic use cases)
 */
export function SimpleSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 pl-10 bg-surface-800 border border-steel-700 rounded-lg text-steel-100 placeholder-steel-500 focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all"
        aria-label="Search"
      />

      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-steel-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-steel-500 hover:text-steel-300 transition-colors"
          aria-label="Clear search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
