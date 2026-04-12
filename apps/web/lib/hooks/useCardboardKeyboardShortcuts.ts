'use client';

import { useEffect } from 'react';

export interface UseCardboardKeyboardShortcutsConfig {
  /** Callback when / is pressed (focus search) */
  onSlashKey?: () => void;
  /** Callback when ? is pressed (show help) */
  onQuestionKey?: () => void;
  /** Callback when Arrow Left is pressed (prev card) */
  onArrowLeft?: () => void;
  /** Callback when Arrow Right is pressed (next card) */
  onArrowRight?: () => void;
  /** Callback when Enter is pressed (add/remove from deck) */
  onEnter?: () => void;
  /** Whether keyboard shortcuts are enabled */
  enabled?: boolean;
}

/**
 * Hook for Moxfield-style keyboard shortcuts
 *
 * Shortcuts:
 * - `/` — Focus search input
 * - `?` — Show keyboard shortcuts help modal
 * - `←` / `→` — Navigate cards (previous/next)
 * - `Enter` — Add/remove from deck
 * - `Escape` — Close modal (handled by consumer)
 *
 * @example
 * ```tsx
 * const [showHelp, setShowHelp] = useState(false);
 * const [cardIndex, setCardIndex] = useState(0);
 *
 * useCardboardKeyboardShortcuts({
 *   onSlashKey: () => searchInputRef.current?.focus(),
 *   onQuestionKey: () => setShowHelp(true),
 *   onArrowLeft: () => setCardIndex(i => Math.max(0, i - 1)),
 *   onArrowRight: () => setCardIndex(i => Math.min(cards.length - 1, i + 1)),
 *   onEnter: () => addCardToD eck(cards[cardIndex]),
 * });
 * ```
 */
export function useCardboardKeyboardShortcuts(config: UseCardboardKeyboardShortcutsConfig): void {
  const { onSlashKey, onQuestionKey, onArrowLeft, onArrowRight, onEnter, enabled = true } = config;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea (unless it's the search box)
      const target = e.target as HTMLElement;
      const isInputField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      // Allow "/" even in search input to maintain Moxfield behavior
      if (e.key === '/' && onSlashKey) {
        if (!isInputField) {
          e.preventDefault();
          onSlashKey();
        }
        return;
      }

      // For other shortcuts, skip if in input field
      if (isInputField) return;

      // ? to show help
      if (e.key === '?' && onQuestionKey) {
        e.preventDefault();
        onQuestionKey();
        return;
      }

      // Arrow left for prev
      if (e.key === 'ArrowLeft' && onArrowLeft) {
        e.preventDefault();
        onArrowLeft();
        return;
      }

      // Arrow right for next
      if (e.key === 'ArrowRight' && onArrowRight) {
        e.preventDefault();
        onArrowRight();
        return;
      }

      // Enter to add/remove
      if (e.key === 'Enter' && onEnter) {
        e.preventDefault();
        onEnter();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onSlashKey, onQuestionKey, onArrowLeft, onArrowRight, onEnter]);
}
