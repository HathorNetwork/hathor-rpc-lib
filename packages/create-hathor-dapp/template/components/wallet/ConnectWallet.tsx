'use client';

import { useRequestSnap, useMetaMaskContext } from '@hathor/snap-utils';
import { useState } from 'react';
import { WalletInfo } from './WalletInfo';

export function ConnectWallet() {
  const requestSnap = useRequestSnap();
  const { installedSnap, error } = useMetaMaskContext();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await requestSnap();
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Check if MetaMask is installed
  if (typeof window !== 'undefined' && !window.ethereum) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">🦊</div>
        <h2 className="text-2xl font-bold mb-4">MetaMask Required</h2>
        <p className="text-gray-600 mb-6">
          You need MetaMask to use this dApp. Please install MetaMask browser extension to continue.
        </p>
        <a
          href="https://metamask.io/download"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  if (installedSnap) {
    return <WalletInfo />;
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center">
      <div className="text-6xl mb-4">🎲</div>
      <h2 className="text-2xl font-bold mb-4">Connect to Hathor</h2>
      <p className="text-gray-600 mb-6">
        Connect your MetaMask wallet with Hathor Snap to start playing provably fair dice!
      </p>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-hathor-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-hathor-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error.message || 'Failed to connect. Please try again.'}
        </div>
      )}
    </div>
  );
}
