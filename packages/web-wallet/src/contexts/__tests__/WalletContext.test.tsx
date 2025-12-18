import { describe, it, expect, vi, beforeEach } from 'vitest';
import type React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Hoisted mocks - must be defined before vi.mock calls
const {
  mockInvokeSnap,
  mockRequestSnap,
  mockRequest,
  mockUseMetaMaskContext,
  mockReadOnlyWalletWrapper,
  mockTokenRegistryService,
  mockRegisteredTokenStorageService,
  mockNftDetectionService,
  mockLoadTokensWithBalances,
  mockGetAddressForMode,
  mockLoadAddressMode,
  mockSaveAddressMode,
  mockWalletServiceMethods,
} = vi.hoisted(() => ({
  mockInvokeSnap: vi.fn(),
  mockRequestSnap: vi.fn(),
  mockRequest: vi.fn(),
  mockUseMetaMaskContext: vi.fn(() => ({ error: null as Error | null })),
  mockReadOnlyWalletWrapper: {
    initialize: vi.fn(),
    stop: vi.fn(),
    isReady: vi.fn(() => false),
    getBalance: vi.fn(),
    getTransactionHistory: vi.fn(),
    getCurrentAddress: vi.fn(),
    isAddressMine: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  mockTokenRegistryService: {
    getRegisteredTokens: vi.fn(() => []),
    registerToken: vi.fn(),
    unregisterToken: vi.fn(),
  },
  mockRegisteredTokenStorageService: {
    loadTokens: vi.fn(() => []),
    saveTokens: vi.fn(),
  },
  mockNftDetectionService: {
    detectNftBatch: vi.fn(() => Promise.resolve(new Map())),
    clearCache: vi.fn(),
  },
  mockLoadTokensWithBalances: vi.fn(() => Promise.resolve({
    tokens: [],
    warning: null,
    failedTokens: [],
  })),
  mockGetAddressForMode: vi.fn(() => Promise.resolve('HTestAddress123')),
  mockLoadAddressMode: vi.fn(() => ({ mode: 'first' })),
  mockSaveAddressMode: vi.fn(() => true),
  mockWalletServiceMethods: {
    sendTransaction: vi.fn(),
    getAddress: vi.fn(),
    getBalance: vi.fn(),
    getConnectedNetwork: vi.fn(),
    getTransactionHistory: vi.fn(),
  },
}));

// Mock snap-utils hooks
vi.mock('@hathor/snap-utils', () => ({
  useInvokeSnap: () => mockInvokeSnap,
  useRequestSnap: () => mockRequestSnap,
  useRequest: () => mockRequest,
  useMetaMaskContext: mockUseMetaMaskContext,
  MetaMaskProvider: ({ children }: { children: React.ReactNode }) => children,
  defaultSnapOrigin: 'local:http://localhost:8080',
}));

// Mock services
vi.mock('../../services/ReadOnlyWalletWrapper', () => ({
  readOnlyWalletWrapper: mockReadOnlyWalletWrapper,
}));

vi.mock('../../services/TokenRegistryService', () => ({
  tokenRegistryService: mockTokenRegistryService,
}));

vi.mock('../../services/RegisteredTokenStorageService', () => ({
  registeredTokenStorageService: mockRegisteredTokenStorageService,
}));

vi.mock('../../services/NftDetectionService', () => ({
  nftDetectionService: mockNftDetectionService,
}));

vi.mock('../../services/SnapService', () => ({
  WalletServiceMethods: mockWalletServiceMethods,
  SnapUnauthorizedError: class SnapUnauthorizedError extends Error {
    code: number;
    constructor(message: string, code: number = 4100) {
      super(message);
      this.name = 'SnapUnauthorizedError';
      this.code = code;
    }
  },
}));

// Mock utilities
vi.mock('../../utils/tokenLoading', () => ({
  loadTokensWithBalances: mockLoadTokensWithBalances,
  fetchTokenBalance: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../utils/addressMode', () => ({
  getAddressForMode: mockGetAddressForMode,
  loadAddressMode: mockLoadAddressMode,
  saveAddressMode: mockSaveAddressMode,
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../../utils/promise', () => ({
  raceWithTimeout: vi.fn((promise) => promise),
}));

// Mock ConnectionLostModal component
vi.mock('../../components/ConnectionLostModal', () => ({
  ConnectionLostModal: () => null,
}));

// Import after mocks are defined
import { WalletProvider, useWallet } from '../WalletContext';

// Test component to consume context
function TestConsumer({ onContext }: { onContext?: (ctx: ReturnType<typeof useWallet>) => void }) {
  const context = useWallet();
  onContext?.(context);
  return (
    <div>
      <span data-testid="isConnected">{String(context.isConnected)}</span>
      <span data-testid="isConnecting">{String(context.isConnecting)}</span>
      <span data-testid="address">{context.address}</span>
      <span data-testid="network">{context.network}</span>
      <span data-testid="error">{context.error || 'no-error'}</span>
      <span data-testid="tokenFilter">{context.selectedTokenFilter}</span>
      <span data-testid="addressMode">{context.addressMode}</span>
      <button onClick={context.connectWallet} data-testid="connect">Connect</button>
      <button onClick={context.disconnectWallet} data-testid="disconnect">Disconnect</button>
      <button onClick={() => context.setError('test error')} data-testid="setError">Set Error</button>
      <button onClick={() => context.setError(null)} data-testid="clearError">Clear Error</button>
      <button onClick={() => context.setSelectedTokenFilter('nfts')} data-testid="filterNfts">Filter NFTs</button>
    </div>
  );
}

describe('WalletContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.ethereum for wallet_getSnaps calls
    global.window.ethereum = {
      request: vi.fn(),
      isMetaMask: true,
    } as unknown as typeof window.ethereum;
    localStorage.clear();

    // Reset mock implementations
    mockReadOnlyWalletWrapper.isReady.mockReturnValue(false);
    mockReadOnlyWalletWrapper.getBalance.mockResolvedValue([]);
    mockUseMetaMaskContext.mockReturnValue({ error: null });
    mockLoadAddressMode.mockReturnValue({ mode: 'first' });
  });

  describe('Provider', () => {
    it('should render children without crashing', () => {
      render(
        <WalletProvider>
          <div data-testid="child">Hello</div>
        </WalletProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('should provide default disconnected state', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('isConnecting')).toHaveTextContent('false');
      expect(screen.getByTestId('address')).toHaveTextContent('');
    });

    it('should provide default network as mainnet', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('network')).toHaveTextContent('mainnet');
      });
    });

    it('should provide default token filter as tokens', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tokenFilter')).toHaveTextContent('tokens');
      });
    });

    it('should load address mode from storage on mount', async () => {
      mockLoadAddressMode.mockReturnValue({ mode: 'change' });

      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('addressMode')).toHaveTextContent('change');
      });
    });
  });

  describe('useWallet hook', () => {
    it('should throw when used outside WalletProvider', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useWallet must be used within a WalletProvider');

      spy.mockRestore();
    });
  });

  describe('error management', () => {
    it('should allow setting error message', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });

      await act(async () => {
        screen.getByTestId('setError').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('test error');
    });

    it('should allow clearing error message', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        screen.getByTestId('setError').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('test error');

      await act(async () => {
        screen.getByTestId('clearError').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should display metamask errors from context', async () => {
      const metamaskError = new Error('MetaMask not found');
      mockUseMetaMaskContext.mockReturnValue({ error: metamaskError });

      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('MetaMask not found');
      });
    });
  });

  describe('token filter', () => {
    it('should allow changing token filter', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tokenFilter')).toHaveTextContent('tokens');
      });

      await act(async () => {
        screen.getByTestId('filterNfts').click();
      });

      expect(screen.getByTestId('tokenFilter')).toHaveTextContent('nfts');
    });
  });

  describe('disconnectWallet', () => {
    it('should clear all state when disconnecting', async () => {
      // Set up localStorage with stored values
      localStorage.setItem('hathor_wallet_xpub', 'xpub123');
      localStorage.setItem('hathor_wallet_network', 'testnet');

      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        screen.getByTestId('disconnect').click();
      });

      // Verify state is reset
      expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      expect(screen.getByTestId('address')).toHaveTextContent('');

      // Verify localStorage is cleared
      expect(localStorage.getItem('hathor_wallet_xpub')).toBeNull();
      expect(localStorage.getItem('hathor_wallet_network')).toBeNull();

      // Verify service cleanup
      expect(mockReadOnlyWalletWrapper.stop).toHaveBeenCalled();
    });
  });

  describe('existing connection check', () => {
    it('should check for existing connection on mount when xpub stored', async () => {
      localStorage.setItem('hathor_wallet_xpub', 'xpub123');
      localStorage.setItem('hathor_wallet_network', 'testnet');

      // Mock window.ethereum.request for wallet_getSnaps
      vi.mocked(window.ethereum!.request).mockResolvedValue({
        'local:http://localhost:8080': {
          version: '1.0.0',
          enabled: true,
          blocked: false,
        },
      });

      mockReadOnlyWalletWrapper.isReady.mockReturnValue(true);
      mockReadOnlyWalletWrapper.getBalance.mockResolvedValue(
        new Map([['00', { token: '00', available: 1000n, locked: 0n }]])
      );

      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      // Should attempt to initialize with stored xpub
      await waitFor(() => {
        expect(mockReadOnlyWalletWrapper.initialize).toHaveBeenCalledWith('xpub123', 'testnet');
      }, { timeout: 3000 });
    });

    it('should not check connection when no xpub stored', async () => {
      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      });

      // Should not attempt to initialize
      expect(mockReadOnlyWalletWrapper.initialize).not.toHaveBeenCalled();
    });
  });

  describe('context value structure', () => {
    it('should provide all required methods', async () => {
      let capturedContext: ReturnType<typeof useWallet> | null = null;

      render(
        <WalletProvider>
          <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(capturedContext).not.toBeNull();
      });

      // Verify all methods exist
      expect(typeof capturedContext!.connectWallet).toBe('function');
      expect(typeof capturedContext!.disconnectWallet).toBe('function');
      expect(typeof capturedContext!.refreshBalance).toBe('function');
      expect(typeof capturedContext!.refreshAddress).toBe('function');
      expect(typeof capturedContext!.getTransactionHistory).toBe('function');
      expect(typeof capturedContext!.sendTransaction).toBe('function');
      expect(typeof capturedContext!.changeNetwork).toBe('function');
      expect(typeof capturedContext!.setError).toBe('function');
      expect(typeof capturedContext!.clearNewTransaction).toBe('function');
      expect(typeof capturedContext!.registerToken).toBe('function');
      expect(typeof capturedContext!.unregisterToken).toBe('function');
      expect(typeof capturedContext!.refreshTokenBalances).toBe('function');
      expect(typeof capturedContext!.setSelectedTokenFilter).toBe('function');
      expect(typeof capturedContext!.getTokenInfo).toBe('function');
      expect(typeof capturedContext!.setAddressMode).toBe('function');
    });

    it('should provide all required state properties', async () => {
      let capturedContext: ReturnType<typeof useWallet> | null = null;

      render(
        <WalletProvider>
          <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(capturedContext).not.toBeNull();
      });

      // Verify all state properties exist
      expect(capturedContext).toHaveProperty('isConnected');
      expect(capturedContext).toHaveProperty('isConnecting');
      expect(capturedContext).toHaveProperty('isCheckingConnection');
      expect(capturedContext).toHaveProperty('loadingStep');
      expect(capturedContext).toHaveProperty('address');
      expect(capturedContext).toHaveProperty('balances');
      expect(capturedContext).toHaveProperty('network');
      expect(capturedContext).toHaveProperty('error');
      expect(capturedContext).toHaveProperty('xpub');
      expect(capturedContext).toHaveProperty('newTransaction');
      expect(capturedContext).toHaveProperty('registeredTokens');
      expect(capturedContext).toHaveProperty('selectedTokenFilter');
      expect(capturedContext).toHaveProperty('selectedTokenForSend');
      expect(capturedContext).toHaveProperty('addressMode');
    });
  });

  describe('connectWallet', () => {
    it('should set isConnecting during connection attempt', async () => {
      // Create a promise that we can control
      let resolveRequestSnap: () => void;
      mockRequestSnap.mockImplementation(() => new Promise<void>((resolve) => {
        resolveRequestSnap = resolve;
      }));

      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      // Start connection
      await act(async () => {
        screen.getByTestId('connect').click();
      });

      // Should be connecting
      expect(screen.getByTestId('isConnecting')).toHaveTextContent('true');

      // Resolve to clean up
      await act(async () => {
        resolveRequestSnap!();
      });
    });

    it('should handle connection errors gracefully', async () => {
      mockRequestSnap.mockRejectedValue(new Error('User rejected'));

      render(
        <WalletProvider>
          <TestConsumer />
        </WalletProvider>
      );

      await act(async () => {
        screen.getByTestId('connect').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('isConnecting')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('User rejected');
    });
  });
});
