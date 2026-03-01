/**
 * DragDropContext
 * Manages drag & drop state and feedback for card movement between zones.
 * Wraps @dnd-kit/core DndContext with PointerSensor + TouchSensor and
 * validates drops via useDragDropZones before calling onCardPlayRequested.
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { CardInstance } from '@/lib/game/game-engine';
import type { ZoneType } from '@/lib/hooks/useDragDropZones';
import { useDragDropZones } from '@/lib/hooks/useDragDropZones';

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
  cardDatabase?: Record<string, any>;
  onCardPlayRequested?: (card: CardInstance) => void;
  onDropError?: (message: string) => void;
}

/**
 * Provider for drag & drop state management.
 * Includes dnd-kit DndContext with PointerSensor + TouchSensor.
 */
export function DragDropProvider({
  children,
  cardDatabase = {},
  onCardPlayRequested,
  onDropError,
}: DragDropProviderProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedCard: null,
    sourceZone: null,
    targetZone: null,
    isValid: false,
  });

  const { validateZonePlacement } = useDragDropZones();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const startDrag = useCallback((card: CardInstance, zone: ZoneType) => {
    setDragState({
      draggedCard: card,
      sourceZone: zone,
      targetZone: null,
      isValid: false,
    });
  }, []);

  const setTargetZone = useCallback((zone: ZoneType | null) => {
    setDragState((prev) => ({ ...prev, targetZone: zone }));
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
    setDragState((prev) => ({ ...prev, isValid: valid, feedback }));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const card: CardInstance | undefined = active.data.current?.card;
      const fromZone: ZoneType | undefined = active.data.current?.fromZone;
      const toZone: ZoneType | undefined = over.data.current?.zone;

      if (!card || !fromZone || !toZone) return;

      const validation = validateZonePlacement(card, fromZone, toZone, cardDatabase);
      if (validation.valid) {
        onCardPlayRequested?.(card);
      } else {
        onDropError?.(validation.reason ?? 'Invalid placement');
      }
    },
    [cardDatabase, onCardPlayRequested, onDropError, validateZonePlacement],
  );

  return (
    <DragDropContext.Provider
      value={{ dragState, startDrag, setTargetZone, endDrag, setValidation }}
    >
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
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
