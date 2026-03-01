/**
 * useKeyboardShortcuts Hook
 * Manages keyboard shortcuts for the game
 */

'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
  onNextPhase?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDeselectCard?: () => void;
  onToggleLog?: () => void;
  onToggleHand?: () => void;
  onToggleBoard?: () => void;
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Get the key and check for modifiers
      const key = event.key.toLowerCase();
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (true) {
        // Enter = Next Phase
        case key === 'enter':
          event.preventDefault();
          config.onNextPhase?.();
          break;

        // Escape = Deselect card
        case key === 'escape':
          event.preventDefault();
          config.onDeselectCard?.();
          break;

        // Ctrl+Z (or Cmd+Z) = Undo
        case isCtrlOrCmd && key === 'z' && !isShift:
          event.preventDefault();
          config.onUndo?.();
          break;

        // Ctrl+Y (or Cmd+Shift+Z) = Redo
        case (isCtrlOrCmd && key === 'y') || (isCtrlOrCmd && key === 'z' && isShift):
          event.preventDefault();
          config.onRedo?.();
          break;

        // M = Toggle game log
        case key === 'm':
          event.preventDefault();
          config.onToggleLog?.();
          break;

        // H = Toggle hand visibility
        case key === 'h':
          event.preventDefault();
          config.onToggleHand?.();
          break;

        // B = Toggle board visibility
        case key === 'b':
          event.preventDefault();
          config.onToggleBoard?.();
          break;

        // ? or / = Show help
        case key === '?' || key === '/':
          event.preventDefault();
          config.onShowHelp?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config]);
}
