import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockUseWallet, mockFetchTokenDetails } = vi.hoisted(() => ({
  mockUseWallet: vi.fn(),
  mockFetchTokenDetails: vi.fn(),
}));

vi.mock('../../contexts/WalletContext', () => ({
  useWallet: mockUseWallet,
}));

vi.mock('../../services/TokenDiscoveryService', () => ({
  tokenDiscoveryService: {
    fetchTokenDetails: mockFetchTokenDetails,
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      discoveredTokenUids: ['token-b-uid', 'token-c-uid'],
      refreshDiscovery: vi.fn().mockResolvedValue(undefined),
    }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@hathor/wallet-lib', () => ({
  tokensUtils: {
    getConfigurationString: vi.fn((uid: string, name: string, symbol: string) =>
      `[${name}:${symbol}:${uid}:checksum]`
    ),
  },
}));

vi.mock('../../utils/hathor', () => ({
  truncateString: (str: string, start = 5, end = 5) => `${str.slice(0, start)}...${str.slice(-end)}`,
}));

vi.mock('../../constants', () => ({
  HATHOR_EXPLORER_URLS: {
    MAINNET: 'https://explorer.hathor.network',
    TESTNET: 'https://explorer.testnet.hathor.network',
  },
  NETWORKS: {
    MAINNET: 'mainnet',
    TESTNET: 'testnet',
  },
}));

// Mock IntersectionObserver (not available in jsdom)
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

import ImportTokensDialog from '../ImportTokensDialog';

describe('ImportTokensDialog', () => {
  const mockOnClose = vi.fn();
  const mockRegisterTokensBatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockUseWallet.mockReturnValue({
      registerTokensBatch: mockRegisterTokensBatch,
      network: 'mainnet',
      isConnected: true,
    });

    mockFetchTokenDetails.mockImplementation(async (uid: string) => {
      if (uid === 'token-b-uid') {
        return { uid: 'token-b-uid', name: 'TokenB', symbol: 'TKB', balance: { available: 20000n, locked: 0n } };
      }
      if (uid === 'token-c-uid') {
        return { uid: 'token-c-uid', name: 'TokenC', symbol: 'TKC', balance: { available: 50076n, locked: 10n } };
      }
      return null;
    });

    mockRegisterTokensBatch.mockResolvedValue({ registered: [], errors: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    render(<ImportTokensDialog isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Import Tokens')).not.toBeInTheDocument();
  });

  it('should render select step with token list', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Import Tokens')).toBeInTheDocument();
    expect(screen.getByText('Tokens found (2)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });
  });

  it('should show confirm step after selecting tokens and clicking Continue', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    // Select a token
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);

    // Click Continue
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Should show confirm step
    await waitFor(() => {
      expect(screen.getByText('Confirm import')).toBeInTheDocument();
      expect(screen.getByText('You are about to add these tokens to your wallet:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Import tokens' })).toBeInTheDocument();
    });
  });

  it('should go back to select step when Cancel is clicked on confirm', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('Confirm import')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.getByText('Tokens found (2)')).toBeInTheDocument();
    });
  });

  it('should show success step after importing', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    // Select + Continue + Import
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Import tokens' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Import tokens' }));

    await waitFor(() => {
      expect(screen.getByText('Tokens imported!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'See all tokens' })).toBeInTheDocument();
    });
  });

  it('should show error and return to select step when import fails', async () => {
    mockRegisterTokensBatch.mockResolvedValue({ registered: [], errors: [{ configString: 'x', error: 'Registration failed' }] });

    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Import tokens' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Import tokens' }));

    // Should go back to select step with error message
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
      expect(screen.getByText('Tokens found (2)')).toBeInTheDocument();
    });
  });

  it('should navigate to tokens filter when See all tokens is clicked', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Import tokens' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Import tokens' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'See all tokens' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'See all tokens' }));

    expect(mockNavigate).toHaveBeenCalledWith('/?filter=tokens');
  });
});
