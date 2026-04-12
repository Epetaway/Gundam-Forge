import React from 'react';

interface CardPreviewTileProps {
  imageUrl?: string;
  name: string;
  cost?: number;
  type?: string;
  qty: number;
  onClick: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function CardPreviewTile({ imageUrl, name, cost, type, qty, onClick, onAdd, onRemove }: CardPreviewTileProps) {
  return (
    <div className="group relative rounded-md bg-black overflow-hidden focus:outline-none">
      <button
        className="block w-full"
        onClick={onClick}
        tabIndex={0}
        aria-label={`View ${name}${cost !== undefined ? ` — Cost ${cost}` : ''}${type ? `, ${type}` : ''}`}
      >
        {imageUrl && (
          <img src={imageUrl} alt={name} className="aspect-[5/7] w-full object-cover" loading="lazy" />
        )}
        {qty > 1 && (
          <span className="absolute right-2 top-2 z-10 rounded bg-black/80 px-2 py-0.5 font-mono text-xs font-bold text-white shadow">
            x{qty}
          </span>
        )}
      </button>

      {/* Builder controls: show on hover (desktop) */}
      {(onAdd || onRemove) && (
        <div className="absolute right-1.5 top-7 z-20 flex flex-col items-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onAdd && (
            <button
              aria-label={`Add ${name} to deck`}
              className="rounded bg-cobalt-600 px-2 py-0.5 text-xs font-bold text-white shadow hover:bg-cobalt-700"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              +
            </button>
          )}
          {onRemove && (
            <button
              aria-label={`Remove ${name} from deck`}
              className="rounded bg-steel-700 px-2 py-0.5 text-xs font-bold text-white shadow hover:bg-steel-800"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
            >
              –
            </button>
          )}
        </div>
      )}
    </div>
  );
}
