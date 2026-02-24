import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: 'gf-modal-sm',
  md: 'gf-modal-md',
  lg: 'gf-modal-lg',
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="gf-modal-backdrop" />
        <Dialog.Content
          className={`gf-modal-content ${sizeClasses[size]}`}
          aria-describedby={undefined}
        >
          <div className="gf-inspection-header">
            <Dialog.Title className="flex-1 text-inherit font-inherit tracking-inherit">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="gf-btn gf-btn-ghost p-0 w-7 h-7 rounded-md text-gf-text-muted hover:text-gf-text"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
