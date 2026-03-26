import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockUseWallet, mockFetchTokenDetails, mockDiscoverTokenUids } = vi.hoisted(() => ({
  mockUseWallet: vi.fn(),
  mockFetchTokenDetails: vi.fn(),
  mockDiscoverTokenUids: vi.fn(),
}));

vi.mock('../../contexts/WalletContext', () => ({
  useWallet: mockUseWallet,
}));

vi.mock('../../services/TokenDiscoveryService', () => ({
  tokenDiscoveryService: {
    fetchTokenDetails: mockFetchTokenDetails,
    discoverTokenUids: mockDiscoverTokenUids,
  },
}));

vi.mock('../../hooks/useTokenDiscovery', () => ({
  useTokenDiscovery: () => ({
    discoveredTokenUids: ['token-b-uid', 'token-c-uid'],
    isDiscovering: false,
    isDismissed: false,
    dismissBanner: vi.fn(),
    refreshDiscovery: vi.fn().mockResolvedValue(undefined),
  }),
}));

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

    mockFetchTokenDetails
      .mockImplementation(async (uid: string) => {
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

  it('should render dialog with token UIDs and lazy load details', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Import Tokens')).toBeInTheDocument();
    expect(screen.getByText('Check before importing tokens')).toBeInTheDocument();
    expect(screen.getByText('Tokens found (2)')).toBeInTheDocument();

    // Details load lazily
    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });
  });

  it('should enable Continue button only when tokens are selected', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(continueButton).toBeDisabled();

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);

    expect(continueButton).not.toBeDisabled();
  });

  it('should toggle token selection on checkbox click', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');

    await userEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    await userEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('should select all tokens when Select all is clicked', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Tokens found (2)')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Select all'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('should import selected tokens on Continue click', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(mockRegisterTokensBatch).toHaveBeenCalledOnce();
      expect(screen.getByText('Tokens imported successfully!')).toBeInTheDocument();
    });
  });

  it('should show error when import fails', async () => {
    mockRegisterTokensBatch.mockResolvedValue({ registered: [], errors: [{ configString: 'x', error: 'Registration failed' }] });

    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('TKB (TokenB)')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it('should have explorer links for each token', async () => {
    render(<ImportTokensDialog isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Tokens found (2)')).toBeInTheDocument();
    });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('token_detail/token-b-uid'));
    expect(links[1]).toHaveAttribute('href', expect.stringContaining('token_detail/token-c-uid'));
  });
});
