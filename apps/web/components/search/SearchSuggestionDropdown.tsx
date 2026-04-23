'use client';

/**
 * Search Suggestion Dropdown
 * 
 * Autocomplete dropdown with keyboard navigation for search input.
 * Groups suggestions by category (Effects, Clans, Cards).
 */

import { useEffect, useRef, useState } from 'react';
import type { SuggestionGroup } from '@/lib/search/searchSuggestions';

export interface SearchSuggestionDropdownProps {
  /** Suggestion groups to display */
  suggestions: SuggestionGroup[];
  /** Currently selected suggestion index */
  selectedIndex: number;
  /** Callback when suggestion is selected */
  onSelect: (value: string) => void;
  /** Whether dropdown is visible */
  isOpen: boolean;
  /** Callback to close dropdown */
  onClose: () => void;
  /** Loading state */
  isLoading?: boolean;
}

export function SearchSuggestionDropdown({
  suggestions,
  selectedIndex,
  onSelect,
  isOpen,
  onClose,
  isLoading = false,
}: SearchSuggestionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && isOpen) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div
        ref={dropdownRef}
        className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-surface-elevated p-4 shadow-lg"
        role="status"
        aria-live="polite"
      >
        <div className="text-sm text-text-secondary">Loading suggestions...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div
        ref={dropdownRef}
        className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-surface-elevated p-4 shadow-lg"
        role="status"
        aria-live="polite"
      >
        <div className="text-sm text-text-muted">No suggestions found</div>
      </div>
    );
  }

  let currentIndex = 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-surface-elevated shadow-lg"
      role="listbox"
      aria-label="Search suggestions"
    >
      {suggestions.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`} className="py-2">
          {/* Group Header */}
          <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {group.label}
          </div>

          {/* Group Suggestions */}
          <div>
            {group.suggestions.map((suggestion, suggestionIndex) => {
              const isSelected = currentIndex === selectedIndex;
              const suggestionRef = isSelected ? selectedRef : null;
              currentIndex++;

              return (
                <button
                  key={`${groupIndex}-${suggestionIndex}`}
                  ref={suggestionRef}
                  type="button"
                  onClick={() => onSelect(suggestion.value)}
                  className={`
                    w-full px-4 py-2 text-left flex items-center justify-between gap-2
                    transition-colors duration-150
                    ${isSelected ? 'bg-cobalt-600 text-white' : 'text-text-primary hover:bg-surface-interactive'}
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{suggestion.label}</div>
                    {suggestion.category && (
                      <div className="text-xs capitalize text-text-muted">
                        {suggestion.category.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>

                  {suggestion.count !== undefined && (
                    <div className="rounded bg-surface px-2 py-1 text-xs text-text-muted">
                      {suggestion.count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Hook for managing suggestion dropdown state
 */
export function useSuggestionNavigation(suggestionsCount: number, isOpen: boolean) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Reset selection when suggestions change
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestionsCount - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Escape':
        event.preventDefault();
        setSelectedIndex(-1);
        break;
    }
  };

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  };
}
