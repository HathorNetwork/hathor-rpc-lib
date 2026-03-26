import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTokensBanner from '../NewTokensBanner';

describe('NewTokensBanner', () => {
  const mockOnImportClick = vi.fn();
  const mockOnDismiss = vi.fn();

  it('should not render when tokenCount is 0', () => {
    render(
      <NewTokensBanner
        tokenCount={0}
        onImportClick={mockOnImportClick}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText('New tokens')).not.toBeInTheDocument();
  });

  it('should render when tokenCount is greater than 0', () => {
    render(
      <NewTokensBanner
        tokenCount={3}
        onImportClick={mockOnImportClick}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('New tokens')).toBeInTheDocument();
    expect(screen.getByText(/We found tokens linked to your address/)).toBeInTheDocument();
    expect(screen.getByText('Import tokens.')).toBeInTheDocument();
  });

  it('should call onImportClick when Import tokens link is clicked', async () => {
    render(
      <NewTokensBanner
        tokenCount={2}
        onImportClick={mockOnImportClick}
        onDismiss={mockOnDismiss}
      />
    );

    await userEvent.click(screen.getByText('Import tokens.'));
    expect(mockOnImportClick).toHaveBeenCalledOnce();
  });

  it('should call onDismiss when X button is clicked', async () => {
    render(
      <NewTokensBanner
        tokenCount={2}
        onImportClick={mockOnImportClick}
        onDismiss={mockOnDismiss}
      />
    );

    // Find the dismiss button (the one with X icon)
    const buttons = screen.getAllByRole('button');
    const dismissButton = buttons.find(btn => btn !== screen.getByText('Import tokens.'));
    await userEvent.click(dismissButton!);

    expect(mockOnDismiss).toHaveBeenCalledOnce();
  });
});
