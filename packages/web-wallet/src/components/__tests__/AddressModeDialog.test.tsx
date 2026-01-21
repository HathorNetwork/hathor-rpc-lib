import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Hoisted mocks - must be defined before vi.mock calls
const {
  mockUseWallet,
  mockHasTxOutsideFirstAddress,
  mockIsReady,
} = vi.hoisted(() => ({
  mockUseWallet: vi.fn(),
  mockHasTxOutsideFirstAddress: vi.fn(),
  mockIsReady: vi.fn(),
}));

// Mock the WalletContext
vi.mock('../../contexts/WalletContext', () => ({
  useWallet: mockUseWallet,
}));

// Mock the ReadOnlyWalletWrapper service
vi.mock('../../services/ReadOnlyWalletWrapper', () => ({
  readOnlyWalletWrapper: {
    isReady: mockIsReady,
    hasTxOutsideFirstAddress: mockHasTxOutsideFirstAddress,
  },
}));

// Import after mocks are defined
import AddressModeDialog from '../AddressModeDialog';

describe('AddressModeDialog', () => {
  const mockOnClose = vi.fn();
  const mockSetAddressMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseWallet.mockReturnValue({
      addressMode: 'dynamic',
      setAddressMode: mockSetAddressMode,
    });
    mockIsReady.mockReturnValue(true);
    mockHasTxOutsideFirstAddress.mockResolvedValue(false);
  });

  describe('basic rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<AddressModeDialog isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('Address mode')).not.toBeInTheDocument();
    });

    it('should render dialog when isOpen is true', async () => {
      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Address mode')).toBeInTheDocument();
      });
    });

    it('should call onClose when X button is clicked', async () => {
      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Address mode')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: '' }); // X button has no accessible name
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Single Address mode restriction', () => {
    it('should show loading state while checking transactions', async () => {
      // Make the check hang indefinitely
      mockHasTxOutsideFirstAddress.mockImplementation(
        () => new Promise(() => {})
      );

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Checking address usage...')).toBeInTheDocument();
    });

    it('should enable Single Address option when no transactions outside first address', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(false);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        const singleAddressRadio = screen.getByRole('radio', { name: /single address/i });
        expect(singleAddressRadio).not.toBeDisabled();
      });
    });

    it('should disable Single Address option when transactions exist outside first address', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(true);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        const singleAddressRadio = screen.getByRole('radio', { name: /single address/i });
        expect(singleAddressRadio).toBeDisabled();
      });
    });

    it('should show warning banner when Single Address mode is unavailable', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(true);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Single Address mode unavailable')).toBeInTheDocument();
        expect(screen.getByText(/your wallet has transactions on multiple addresses/i)).toBeInTheDocument();
      });
    });

    it('should show error message and disable Single Address when check fails', async () => {
      mockHasTxOutsideFirstAddress.mockRejectedValue(new Error('Network error'));

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to check address usage')).toBeInTheDocument();
        // Should disable Single Address mode on error as a safety measure
        const singleAddressRadio = screen.getByRole('radio', { name: /single address/i });
        expect(singleAddressRadio).toBeDisabled();
      });
    });

    it('should show error message when wallet is not connected', async () => {
      mockIsReady.mockReturnValue(false);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Wallet not connected')).toBeInTheDocument();
      });
    });

    it('should allow Dynamic Address selection regardless of transaction state', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(true);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        const dynamicAddressRadio = screen.getByRole('radio', { name: /dynamic address/i });
        expect(dynamicAddressRadio).not.toBeDisabled();
      });
    });

    it('should re-check transactions when dialog reopens', async () => {
      mockHasTxOutsideFirstAddress
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const { rerender } = render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /single address/i })).not.toBeDisabled();
      });

      // Close dialog
      rerender(<AddressModeDialog isOpen={false} onClose={mockOnClose} />);

      // Reopen dialog
      rerender(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /single address/i })).toBeDisabled();
      });
    });

    it('should show inline warning text on disabled Single Address option', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(true);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Not available - transactions exist on other addresses')).toBeInTheDocument();
      });
    });
  });

  describe('mode selection', () => {
    it('should update selected mode when clicking Dynamic Address', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(false);
      mockUseWallet.mockReturnValue({
        addressMode: 'single',
        setAddressMode: mockSetAddressMode,
      });

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /dynamic address/i })).toBeInTheDocument();
      });

      const dynamicAddressRadio = screen.getByRole('radio', { name: /dynamic address/i });
      await userEvent.click(dynamicAddressRadio);

      expect(dynamicAddressRadio).toBeChecked();
    });

    it('should update selected mode when clicking Single Address (when enabled)', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(false);
      mockUseWallet.mockReturnValue({
        addressMode: 'dynamic',
        setAddressMode: mockSetAddressMode,
      });

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        const singleAddressRadio = screen.getByRole('radio', { name: /single address/i });
        expect(singleAddressRadio).not.toBeDisabled();
      });

      const singleAddressRadio = screen.getByRole('radio', { name: /single address/i });
      await userEvent.click(singleAddressRadio);

      expect(singleAddressRadio).toBeChecked();
    });

    it('should not allow selecting Single Address when disabled', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(true);
      mockUseWallet.mockReturnValue({
        addressMode: 'dynamic',
        setAddressMode: mockSetAddressMode,
      });

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /single address/i })).toBeDisabled();
      });

      const dynamicAddressRadio = screen.getByRole('radio', { name: /dynamic address/i });
      const singleAddressRadio = screen.getByRole('radio', { name: /single address/i });

      // Try to click the disabled option - should remain unchecked
      await userEvent.click(singleAddressRadio);

      expect(dynamicAddressRadio).toBeChecked();
      expect(singleAddressRadio).not.toBeChecked();
    });
  });

  describe('save functionality', () => {
    it('should call setAddressMode and onClose when Save is clicked', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(false);
      mockSetAddressMode.mockResolvedValue(undefined);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      expect(mockSetAddressMode).toHaveBeenCalledWith('dynamic');
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should save the selected mode', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(false);
      mockSetAddressMode.mockResolvedValue(undefined);

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /single address/i })).not.toBeDisabled();
      });

      // Select Single Address
      const singleAddressRadio = screen.getByRole('radio', { name: /single address/i });
      await userEvent.click(singleAddressRadio);

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      expect(mockSetAddressMode).toHaveBeenCalledWith('single');
    });

    it('should disable Save button while loading', async () => {
      mockHasTxOutsideFirstAddress.mockImplementation(
        () => new Promise(() => {})
      );

      render(<AddressModeDialog isOpen={true} onClose={mockOnClose} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });
});
