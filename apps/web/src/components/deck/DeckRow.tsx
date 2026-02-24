import React from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { IconButton } from '../ui/IconButton';

interface DeckRowProps {
  card: CardDefinition;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onClick: () => void;
  onInspect?: () => void;
  selected?: boolean;
  pulsing?: boolean;
}

const COLOR_DOT: Record<string, string> = {
  Blue: 'bg-card-blue',
  Red: 'bg-card-red',
  Green: 'bg-card-green',
  White: 'bg-card-white border border-gf-border',
  Purple: 'bg-card-purple',
  Colorless: 'bg-gf-gray-400',
};

export const DeckRow = React.memo(function DeckRow({
  card,
  qty,
  onAdd,
  onRemove,
  onClick,
  onInspect,
  selected = false,
  pulsing = false,
}: DeckRowProps) {
  return (
    <div
      className="gf-deck-row flex items-center gap-2 px-3 py-1.5 cursor-pointer"
      data-selected={selected || undefined}
      onClick={onClick}
      onDoubleClick={onInspect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
        if (e.key === ' ' && onInspect) {
          e.preventDefault();
          onInspect();
        }
      }}
    >
      {/* Color dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${COLOR_DOT[card.color] || 'bg-gf-gray-400'}`}
        aria-hidden="true"
      />

      {/* Name */}
      <span className="flex-1 text-sm text-gf-text truncate min-w-0">
        {card.name}
      </span>

      {/* Cost */}
      <span className="text-xs text-gf-gray-400 w-5 text-center flex-shrink-0">
        {card.cost}
      </span>

      {/* Qty controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <IconButton
          icon={<span className="text-xs leading-none">−</span>}
          aria-label={`Remove ${card.name}`}
          variant="ghost"
          size="sm"
          onClick={onRemove}
        />
        <span
          className={`w-5 text-center text-sm font-semibold text-gf-text ${pulsing ? 'gf-animate-qty-pulse' : ''}`}
        >
          {qty}
        </span>
        <IconButton
          icon={<span className="text-xs leading-none">+</span>}
          aria-label={`Add ${card.name}`}
          variant="ghost"
          size="sm"
          onClick={onAdd}
        />
      </div>
    </div>
  );
});
