import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import SendDialog from './SendDialog';
import ReceiveDialog from './ReceiveDialog';
import HistoryDialog from './HistoryDialog';
import RegisterTokenDialog from './RegisterTokenDialog';
import CreateTokenDialog from './CreateTokenDialog';
import TokenTabs from './TokenTabs';
import TokenList from './TokenList';
import Header from './Header';
import ErrorNotification from './ErrorNotification';
import TransactionNotification from './TransactionNotification';
import { useWallet } from '../contexts/WalletContext';
import { useTokens } from '../hooks/useTokens';
import { formatHTRAmount } from '../utils/hathor';
import htrLogoBlack from '../assets/htr_logo_black.svg';
import htrLogoWhite from '../assets/htr_logo_white.svg';
import htrLogoWhiteOutline from '../assets/htr_logo_white_outline.svg';

const WalletHome: React.FC = () => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [registerTokenOpen, setRegisterTokenOpen] = useState(false);
  const [createTokenOpen, setCreateTokenOpen] = useState(false);
  const [selectedTokenForHistory, setSelectedTokenForHistory] = useState<string | null>(null);
  const [selectedTokenForSend, setSelectedTokenForSend] = useState<string | undefined>(undefined);

  const {
    isConnected,
    isConnecting,
    isCheckingConnection,
    loadingStep,
    balances,
    error,
    connectWallet,
    setError,
    newTransaction,
    clearNewTransaction,
    selectedTokenFilter,
    setSelectedTokenFilter,
  } = useWallet();

  const { tokens, tokenCount, nftCount, customTokenCount } = useTokens();

  const handleButtonClick = (buttonName: string) => {
    setActiveButton(buttonName);
    console.log(`${buttonName} button clicked`);

    // Open appropriate dialog
    switch (buttonName) {
      case 'Send':
      case 'SendHTR':
        setSendDialogOpen(true);
        break;
      case 'Receive':
        setReceiveDialogOpen(true);
        break;
      case 'ViewHistory':
        setHistoryDialogOpen(true);
        break;
    }

    // Reset active state after a brief moment
    setTimeout(() => setActiveButton(null), 200);
  };

  // Show loading screen while checking connection
  if (isCheckingConnection) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 flex items-center justify-center mx-auto">
            <img
              src={htrLogoWhite}
              alt="Hathor"
              className="w-full h-full"
            />
          </div>
          <div>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{loadingStep}</p>
          </div>
        </div>
        {/* Error notification */}
        {error && (
          <ErrorNotification
            error={new Error(error)}
            onDismiss={() => setError(null)}
          />
        )}
      </div>
    );
  }

  // Show connection screen if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto p-4 shadow-xl">
            <img
              src={htrLogoBlack}
              alt="Hathor"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-medium mb-2">Connect to Hathor Wallet</h1>
            <p className="text-muted-foreground mb-6">
              Connect your MetaMask with Hathor Snap to get started
            </p>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingStep || 'Connecting...'}
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <Header
        onRegisterTokenClick={() => setRegisterTokenOpen(true)}
        onCreateTokenClick={() => setCreateTokenOpen(true)}
      />

      {/* Main Container - responsive layout */}
      <div className="max-w-7xl mx-auto px-16 py-9 space-y-20">
        {/* Assets Summary Card */}
        <div className="bg-[#191C21] border border-[#24292F] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            {/* Left: Assets Info */}
            <div className="space-y-2">
              <p className="text-xs text-primary-400 uppercase tracking-wider">assets summary</p>
              <div className="flex items-center gap-3">
                {/* HTR Icon */}
                <img
                  src={htrLogoWhiteOutline}
                  alt="HTR"
                  className="w-6 h-6"
                />
                <span className="text-2xl font-medium text-white">
                  {balances.length > 0 ? `${formatHTRAmount(balances[0].available)} HTR` : '0 HTR'}
                </span>
              </div>
              {/* Show custom token and NFT counts */}
              {(customTokenCount > 0 || nftCount > 0) && (
                <p className="text-xs text-muted-foreground">
                  You also have {customTokenCount > 0 && `${customTokenCount} custom token${customTokenCount > 1 ? 's' : ''}`}
                  {customTokenCount > 0 && nftCount > 0 && ' and '}
                  {nftCount > 0 && `${nftCount} NFT${nftCount > 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleButtonClick('Send')}
                className={`px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-xl flex items-center gap-2 transition-colors ${activeButton === 'Send' ? 'bg-primary/90' : ''
                  }`}
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Send</span>
              </button>
              <button
                onClick={() => handleButtonClick('Receive')}
                className={`px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-xl flex items-center gap-2 transition-colors ${activeButton === 'Receive' ? 'bg-primary/90' : ''
                  }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Receive</span>
              </button>
            </div>
          </div>
        </div>

        {/* My Assets Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <h2 className="text-xl font-medium text-white">My Assets</h2>

          {/* Token Tabs */}
          <TokenTabs
            selectedFilter={selectedTokenFilter}
            onFilterChange={setSelectedTokenFilter}
            tokenCount={tokenCount}
            nftCount={nftCount}
          />

          {/* Token List or NFT Placeholder */}
          {selectedTokenFilter === 'nfts' ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">NFT support coming soon</p>
              <p className="text-xs mt-2">You'll be able to view and manage your NFTs here</p>
            </div>
          ) : (
            <TokenList
              tokens={tokens}
              onTokenClick={(tokenUid) => {
                setSelectedTokenForHistory(tokenUid);
                setHistoryDialogOpen(true);
              }}
              onSendClick={(tokenUid) => {
                setSelectedTokenForSend(tokenUid);
                setSendDialogOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <SendDialog
        isOpen={sendDialogOpen}
        onClose={() => {
          setSendDialogOpen(false);
          setSelectedTokenForSend(undefined);
        }}
        initialTokenUid={selectedTokenForSend}
      />
      <ReceiveDialog
        isOpen={receiveDialogOpen}
        onClose={() => setReceiveDialogOpen(false)}
      />
      <HistoryDialog
        isOpen={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedTokenForHistory(null);
        }}
        tokenUid={selectedTokenForHistory || undefined}
        onRegisterTokenClick={() => setRegisterTokenOpen(true)}
      />
      <RegisterTokenDialog
        isOpen={registerTokenOpen}
        onClose={() => setRegisterTokenOpen(false)}
      />
      <CreateTokenDialog
        isOpen={createTokenOpen}
        onClose={() => setCreateTokenOpen(false)}
      />

      {/* Error notification */}
      {error && (
        <ErrorNotification
          error={new Error(error)}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Transaction notification */}
      {(() => {
        if (!newTransaction) return null;
        const tx = newTransaction as Record<string, unknown>;
        if (tx.tx_id) return null; // This is for history dialog, not notification

        const notification = tx as { type: 'sent' | 'received'; amount: number; timestamp: number };
        return (
          <TransactionNotification
            transaction={notification}
            onDismiss={clearNewTransaction}
            onViewHistory={() => {
              clearNewTransaction();
              setHistoryDialogOpen(true);
            }}
          />
        );
      })()}
    </div>
  );
};

export default WalletHome;
