import React from 'react';

interface CardPreviewTileProps {
  imageUrl?: string;
  name: string;
  qty: number;
  onClick: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function CardPreviewTile({ imageUrl, name, qty, onClick, onAdd, onRemove }: CardPreviewTileProps) {
  return (
    <div className="group relative rounded-md border border-border bg-black overflow-hidden focus:outline-none">
      <button
        className="block w-full"
        onClick={onClick}
        tabIndex={0}
        aria-label={`Open ${name}`}
      >
        {imageUrl && (
          <img src={imageUrl} alt={name} className="aspect-[5/7] w-full object-cover" />
        )}
        {qty > 1 && (
          <span className="absolute left-2 top-2 z-10 rounded bg-black/80 px-2 py-0.5 font-mono text-xs font-bold text-white shadow">x{qty}</span>
        )}
      </button>
      {/* Builder controls: show on hover (desktop) */}
      {(onAdd || onRemove) && (
        <div className="absolute bottom-2 right-2 z-20 flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
          {onAdd && (
            <button className="mb-1 rounded bg-cobalt-600 px-2 py-0.5 text-xs font-bold text-white shadow hover:bg-cobalt-700" title="Add one" onClick={e => { e.stopPropagation(); onAdd(); }}>+</button>
          )}
          {onRemove && (
            <button className="rounded bg-steel-700 px-2 py-0.5 text-xs font-bold text-white shadow hover:bg-steel-800" title="Remove one" onClick={e => { e.stopPropagation(); onRemove(); }}>–</button>
          )}
        </div>
      )}
      
    </div>
  );
}
