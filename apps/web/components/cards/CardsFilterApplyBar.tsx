import React from 'react';
import { Button } from '@/components/ui/Button';

interface CardsFilterApplyBarProps {
  cardsUxV2Enabled: boolean;
  isDraftInSync: boolean;
  draftSelectionCount: number;
  onReset: () => void;
  onCancel: () => void;
  onApply: () => void;
}

export function CardsFilterApplyBar({
  cardsUxV2Enabled,
  isDraftInSync,
  draftSelectionCount,
  onReset,
  onCancel,
  onApply,
}: CardsFilterApplyBarProps): JSX.Element {
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-2 border-t border-border bg-surface/95 px-4 py-2 backdrop-blur-sm">
      <Button
        className="flex-1"
        onClick={onReset}
        variant="ghost"
      >
        Reset
      </Button>
      <Button className="flex-1" onClick={onCancel} variant="secondary">
        Cancel
      </Button>
      <Button className="flex-1" disabled={cardsUxV2Enabled && isDraftInSync} onClick={onApply}>
        {cardsUxV2Enabled ? `Apply (${draftSelectionCount})` : 'Apply'}
      </Button>
    </div>
  );
}