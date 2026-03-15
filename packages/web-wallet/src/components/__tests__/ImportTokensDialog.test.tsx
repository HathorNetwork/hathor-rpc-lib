import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Hoisted mocks
const {
  mockUseWallet,
  mockValidateConfigString,
} = vi.hoisted(() => ({
  mockUseWallet: vi.fn(),
  mockValidateConfigString: vi.fn(),
}));

vi.mock('../../contexts/WalletContext', () => ({
  useWallet: mockUseWallet,
}));

vi.mock('../../services/TokenRegistryService', () => ({
  tokenRegistryService: {
    validateConfigString: mockValidateConfigString,
  },
}));

import ImportTokensDialog from '../ImportTokensDialog';

const VALID_CONFIG_1 = '[Teste:TESTE:000031b21d832ec45ea23d2c3d67b84c1e2e816418d8ed2d4c7c9dbe6ace92da:fb734672]';
const VALID_CONFIG_2 = '[DHM 1439842B:DHM:000000b3a1d77152ba131400429dd58a17c88b082a1328c23b24fcc8dbda2c28:cf979ddc]';
const INVALID_CONFIG = '[invalid:config:string]';

// Helper to set textarea value (userEvent.type interprets [] as keyboard modifiers)
function setTextareaValue(textarea: HTMLElement, value: string) {
  fireEvent.change(textarea, { target: { value } });
}

describe('ImportTokensDialog', () => {
  const mockOnClose = vi.fn();
  const mockRegisterToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseWallet.mockReturnValue({
      registerToken: mockRegisterToken,
    });

    mockValidateConfigString.mockImplementation((val: string) => {
      if (val === VALID_CONFIG_1) {
        return {
          valid: true,
          parsed: { name: 'Teste', symbol: 'TESTE', uid: '000031b21d832ec45ea23d2c3d67b84c1e2e816418d8ed2d4c7c9dbe6ace92da' },
        };
      }
      if (val === VALID_CONFIG_2) {
        return {
          valid: true,
          parsed: { name: 'DHM 1439842B', symbol: 'DHM', uid: '000000b3a1d77152ba131400429dd58a17c88b082a1328c23b24fcc8dbda2c28' },
        };
      }
      return { valid: false, error: 'Invalid configuration string format or checksum' };
    });

    mockRegisterToken.mockResolvedValue(undefined);
  });

  describe('basic rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ImportTokensDialog isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('Import Tokens')).not.toBeInTheDocument();
    });

    it('should render dialog when isOpen is true', () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Import Tokens')).toBeInTheDocument();
      expect(screen.getByText('Token Configuration Strings')).toBeInTheDocument();
    });

    it('should call onClose when X button is clicked', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: '' });
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable Preview Import button when textarea is empty', () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      expect(previewButton).toBeDisabled();
    });
  });

  describe('input phase', () => {
    it('should enable Preview Import button when text is entered', () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, VALID_CONFIG_1);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      expect(previewButton).not.toBeDisabled();
    });

    it('should show line count when text is entered', () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, `${VALID_CONFIG_1}\n${VALID_CONFIG_2}`);

      expect(screen.getByText('2 line(s)')).toBeInTheDocument();
    });

    it('should show Load from file button', () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Load from file')).toBeInTheDocument();
    });
  });

  describe('preview phase', () => {
    it('should show valid tokens with names and symbols', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, `${VALID_CONFIG_1}\n${VALID_CONFIG_2}`);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      expect(screen.getByText('2 valid tokens found')).toBeInTheDocument();
      expect(screen.getByText('Teste (TESTE)')).toBeInTheDocument();
      expect(screen.getByText('DHM 1439842B (DHM)')).toBeInTheDocument();
    });

    it('should show invalid tokens with error messages', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, `${VALID_CONFIG_1}\n${INVALID_CONFIG}`);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      expect(screen.getByText('1 valid token found')).toBeInTheDocument();
      expect(screen.getByText('(1 invalid)')).toBeInTheDocument();
    });

    it('should disable import button when no valid tokens', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, INVALID_CONFIG);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const importButton = screen.getByRole('button', { name: /import 0 tokens/i });
      expect(importButton).toBeDisabled();
    });

    it('should go back to input phase when Back is clicked', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, VALID_CONFIG_1);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const backButton = screen.getByRole('button', { name: /back/i });
      await userEvent.click(backButton);

      expect(screen.getByText('Token Configuration Strings')).toBeInTheDocument();
    });
  });

  describe('import phase', () => {
    it('should call registerToken for each valid token', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, `${VALID_CONFIG_1}\n${VALID_CONFIG_2}`);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const importButton = screen.getByRole('button', { name: /import 2 tokens/i });
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(mockRegisterToken).toHaveBeenCalledTimes(2);
        expect(mockRegisterToken).toHaveBeenCalledWith(VALID_CONFIG_1);
        expect(mockRegisterToken).toHaveBeenCalledWith(VALID_CONFIG_2);
      });
    });

    it('should show success state when all tokens imported', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, VALID_CONFIG_1);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const importButton = screen.getByRole('button', { name: /import 1 token$/i });
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/1 token imported successfully/i)).toBeInTheDocument();
      });
    });

    it('should show failure count when some tokens fail', async () => {
      mockRegisterToken
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Network error'));

      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, `${VALID_CONFIG_1}\n${VALID_CONFIG_2}`);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const importButton = screen.getByRole('button', { name: /import 2 tokens/i });
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('1 imported, 1 failed')).toBeInTheDocument();
      });
    });

    it('should only register valid tokens when input has mix of valid and invalid', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, `${VALID_CONFIG_1}\n${INVALID_CONFIG}\n${VALID_CONFIG_2}`);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const importButton = screen.getByRole('button', { name: /import 2 tokens/i });
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(mockRegisterToken).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('done phase', () => {
    it('should close dialog and reset state when Done is clicked', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, VALID_CONFIG_1);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const importButton = screen.getByRole('button', { name: /import 1 token$/i });
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
      });

      const doneButton = screen.getByRole('button', { name: /done/i });
      await userEvent.click(doneButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show per-token error details on failure', async () => {
      mockRegisterToken.mockRejectedValueOnce(new Error('Token already registered'));

      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, VALID_CONFIG_1);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      const importButton = screen.getByRole('button', { name: /import 1 token$/i });
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Token already registered')).toBeInTheDocument();
      });
    });
  });

  describe('empty lines handling', () => {
    it('should ignore empty lines in input', async () => {
      render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/TokenA:TKA/);
      setTextareaValue(textarea, `${VALID_CONFIG_1}\n\n\n${VALID_CONFIG_2}\n`);

      const previewButton = screen.getByRole('button', { name: /preview import/i });
      await userEvent.click(previewButton);

      expect(screen.getByText('2 valid tokens found')).toBeInTheDocument();
    });
  });
});
