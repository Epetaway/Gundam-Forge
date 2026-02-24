import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  side?: 'top' | 'bottom';
  delay?: number;
  children: React.ReactNode;
}

export function Tooltip({
  content,
  side = 'top',
  delay = 400,
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  function show() {
    timeout.current = setTimeout(() => setVisible(true), delay);
  }

  function hide() {
    clearTimeout(timeout.current);
    setVisible(false);
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={[
            'absolute z-tooltip px-2 py-1 rounded-md text-xs font-medium',
            'bg-gf-gray-800 text-white whitespace-nowrap',
            'gf-animate-fade-in pointer-events-none',
            side === 'top'
              ? 'bottom-full left-1/2 -translate-x-1/2 mb-1.5'
              : 'top-full left-1/2 -translate-x-1/2 mt-1.5',
          ].join(' ')}
        >
          {content}
        </div>
      )}
    </div>
  );
}
