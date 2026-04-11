/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaytesterAssistBanner } from '@/components/playtest/PlaytesterAssistBanner';

describe('PlaytesterAssistBanner', () => {
  it('renders decision assist heading and player priority label', () => {
    render(<PlaytesterAssistBanner assistHint="Draw first" isPlayerTurn={true} turnNumber={3} />);

    expect(screen.getByText('Decision Assist')).toBeTruthy();
    expect(screen.getByText('Turn 3 · Your Priority')).toBeTruthy();
    expect(screen.getByText('Draw first')).toBeTruthy();
  });

  it('renders opponent priority label when not player turn', () => {
    render(<PlaytesterAssistBanner assistHint="Waiting" isPlayerTurn={false} turnNumber={6} />);

    expect(screen.getByText('Turn 6 · Opponent Priority')).toBeTruthy();
    expect(screen.getByText('Waiting')).toBeTruthy();
  });
});