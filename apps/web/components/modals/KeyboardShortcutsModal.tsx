'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Master Gundam-Forge with keyboard shortcuts (Moxfield-inspired)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Search</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface px-2 py-1 font-mono font-semibold text-foreground">
                  /
                </kbd>
                <span className="text-steel-400">Focus search</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Navigation</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface px-2 py-1 font-mono font-semibold text-foreground">
                    ←
                  </kbd>
                  <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface px-2 py-1 font-mono font-semibold text-foreground">
                    →
                  </kbd>
                </div>
                <span className="text-steel-400">Previous / Next card</span>
              </div>
              <div className="flex items-center justify-between">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface px-2 py-1 font-mono font-semibold text-foreground">
                  Esc
                </kbd>
                <span className="text-steel-400">Close modal</span>
              </div>
            </div>
          </div>

          {/* Deck Building */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Deck Building</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface px-2 py-1 font-mono font-semibold text-foreground">
                  ↵
                </kbd>
                <span className="text-steel-400">Add / Remove from deck</span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Help</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface px-2 py-1 font-mono font-semibold text-foreground">
                  ?
                </kbd>
                <span className="text-steel-400">Show this help</span>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-md border border-cobalt-400/30 bg-cobalt-500/10 p-4 text-xs text-steel-400">
            <p>💡 <strong>Tip:</strong> Shortcuts don't work while typing in search or filter fields.</p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded p-1 hover:bg-surface-muted"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
