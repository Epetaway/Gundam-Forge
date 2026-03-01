/**
 * DragDropContext
 * Manages drag & drop state and feedback for card movement between zones
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import type { ZoneType } from '@/lib/hooks/useDragDropZones';

export interface DragState {
  draggedCard: CardInstance | null;
  sourceZone: ZoneType | null;
  targetZone: ZoneType | null;
  isValid: boolean;
  feedback?: 'success' | 'warning' | 'error';
}

interface DragDropContextValue {
  dragState: DragState;
  startDrag: (card: CardInstance, zone: ZoneType) => void;
  setTargetZone: (zone: ZoneType | null) => void;
  endDrag: () => void;
  setValidation: (valid: boolean, feedback?: 'success' | 'warning' | 'error') => void;
}

const DragDropContext = createContext<DragDropContextValue | undefined>(undefined);

export interface DragDropProviderProps {
  children: React.ReactNode;
}

/**
 * Provider for drag & drop state management
 */
export function DragDropProvider({ children }: DragDropProviderProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedCard: null,
    sourceZone: null,
    targetZone: null,
    isValid: false,
  });

  const startDrag = useCallback((card: CardInstance, zone: ZoneType) => {
    setDragState({
      draggedCard: card,
      sourceZone: zone,
      targetZone: null,
      isValid: false,
    });
  }, []);

  const setTargetZone = useCallback((zone: ZoneType | null) => {
    setDragState((prev) => ({
      ...prev,
      targetZone: zone,
    }));
  }, []);

  const endDrag = useCallback(() => {
    setDragState({
      draggedCard: null,
      sourceZone: null,
      targetZone: null,
      isValid: false,
    });
  }, []);

  const setValidation = useCallback((valid: boolean, feedback?: 'success' | 'warning' | 'error') => {
    setDragState((prev) => ({
      ...prev,
      isValid: valid,
      feedback,
    }));
  }, []);

  return (
    <DragDropContext.Provider
      value={{
        dragState,
        startDrag,
        setTargetZone,
        endDrag,
        setValidation,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

/**
 * Hook to use drag drop context
 */
export function useDragDropContext() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDropContext must be used within DragDropProvider');
  }
  return context;
}
