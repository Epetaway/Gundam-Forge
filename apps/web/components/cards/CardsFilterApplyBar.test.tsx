/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CardsFilterApplyBar } from '@/components/cards/CardsFilterApplyBar';

afterEach(() => {
  cleanup();
});

describe('CardsFilterApplyBar', () => {
  it('renders V2 apply label and disables apply when draft is in sync', () => {
    const onApply = vi.fn();
    render(
      <CardsFilterApplyBar
        cardsUxV2Enabled={true}
        draftSelectionCount={4}
        isDraftInSync={true}
        onApply={onApply}
        onCancel={() => undefined}
        onReset={() => undefined}
      />,
    );

    const applyButton = screen.getByRole('button', { name: 'Apply (4)' }) as HTMLButtonElement;
    expect(applyButton.disabled).toBe(true);

    fireEvent.click(applyButton);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('renders legacy apply label when V2 is disabled', () => {
    render(
      <CardsFilterApplyBar
        cardsUxV2Enabled={false}
        draftSelectionCount={2}
        isDraftInSync={true}
        onApply={() => undefined}
        onCancel={() => undefined}
        onReset={() => undefined}
      />,
    );

    const applyButton = screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement;
    expect(applyButton.disabled).toBe(false);
  });

  it('invokes reset, cancel, and apply callbacks', () => {
    const onReset = vi.fn();
    const onCancel = vi.fn();
    const onApply = vi.fn();

    render(
      <CardsFilterApplyBar
        cardsUxV2Enabled={true}
        draftSelectionCount={1}
        isDraftInSync={false}
        onApply={onApply}
        onCancel={onCancel}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply (1)' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});