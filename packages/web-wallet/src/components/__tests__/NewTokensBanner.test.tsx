import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTokensBanner from '../NewTokensBanner';

describe('NewTokensBanner', () => {
  const mockOnImportClick = vi.fn();
  const mockOnDismiss = vi.fn();

  const defaultProps = {
    tokenCount: 3,
    isSingleAddress: true,
    onImportClick: mockOnImportClick,
    onDismiss: mockOnDismiss,
  };

  it('should not render when tokenCount is 0', () => {
    render(<NewTokensBanner {...defaultProps} tokenCount={0} />);
    expect(screen.queryByText('New tokens')).not.toBeInTheDocument();
  });

  it('should render with singular "address" for single address mode', () => {
    render(<NewTokensBanner {...defaultProps} isSingleAddress={true} />);
    expect(screen.getByText(/linked to your address that/)).toBeInTheDocument();
  });

  it('should render with plural "addresses" for multi-address mode', () => {
    render(<NewTokensBanner {...defaultProps} isSingleAddress={false} />);
    expect(screen.getByText(/linked to your addresses that/)).toBeInTheDocument();
  });

  it('should call onImportClick when Import tokens link is clicked', async () => {
    render(<NewTokensBanner {...defaultProps} />);
    await userEvent.click(screen.getByText('Import tokens.'));
    expect(mockOnImportClick).toHaveBeenCalledOnce();
  });

  it('should call onDismiss when X button is clicked', async () => {
    render(<NewTokensBanner {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(mockOnDismiss).toHaveBeenCalledOnce();
  });
});
