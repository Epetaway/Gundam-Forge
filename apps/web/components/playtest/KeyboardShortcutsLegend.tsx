/**
 * Keyboard Shortcuts Legend Component
 * Displays available keyboard shortcuts to the user
 */

'use client';

import React from 'react';

interface KeyboardShortcutsLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsLegend({ isOpen, onClose }: KeyboardShortcutsLegendProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Game Control',
      shortcuts: [
        { key: 'Enter', action: 'Advance to next phase' },
        { key: 'Esc', action: 'Deselect card' },
      ],
    },
    {
      category: 'Undo/Redo',
      shortcuts: [
        { key: 'Ctrl+Z / Cmd+Z', action: 'Undo last action' },
        { key: 'Ctrl+Y / Cmd+Shift+Z', action: 'Redo last action' },
      ],
    },
    {
      category: 'UI Visibility',
      shortcuts: [
        { key: 'M', action: 'Toggle game log' },
        { key: 'H', action: 'Toggle hand visibility' },
        { key: 'B', action: 'Toggle board visibility' },
        { key: '? / /', action: 'Show this help menu' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-elevated border-2 border-cobalt-600 rounded-lg max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border p-6">
          <h2 className="text-2xl font-bold text-foreground">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-steel-500 hover:text-foreground text-2xl transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-semibold text-cobalt-400 mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between p-3 bg-surface-muted/50 rounded border border-border hover:border-border transition"
                    >
                      <span className="text-steel-300">{shortcut.action}</span>
                      <code className="bg-surface text-cobalt-300 px-3 py-1 rounded font-mono text-sm border border-border">
                        {shortcut.key}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cobalt-600 hover:bg-cobalt-700 rounded font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
