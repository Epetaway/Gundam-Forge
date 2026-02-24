import React from 'react';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
}

export function Tabs({ items, activeId, onChange, variant = 'underline' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className="flex gap-1" role="tablist">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                active
                  ? 'bg-gf-blue-50 text-gf-blue'
                  : 'text-gf-text-secondary hover:bg-gf-gray-50 hover:text-gf-text',
              ].join(' ')}
            >
              {item.label}
              {item.count != null && (
                <span className="ml-1.5 text-xs text-gf-text-muted">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-0 border-b border-gf-border" role="tablist">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={[
              'relative px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'text-gf-blue'
                : 'text-gf-text-secondary hover:text-gf-text',
            ].join(' ')}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {item.count != null && (
                <span className="text-xs text-gf-text-muted">{item.count}</span>
              )}
            </span>
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gf-blue rounded-t" />
            )}
          </button>
        );
      })}
    </div>
  );
}
