import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Loader2, Eye } from 'lucide-react';
import SendDialog from './SendDialog';
import ReceiveDialog from './ReceiveDialog';
import HistoryDialog from './HistoryDialog';
import RegisterTokenDialog from './RegisterTokenDialog';
import CreateTokenDialog from './CreateTokenDialog';
import AddressModeDialog from './AddressModeDialog';
import TokenTabs from './TokenTabs';
import TokenList from './TokenList';
import Header from './Header';
import { useWallet } from '../contexts/WalletContext';
import { useTokens } from '../hooks/useTokens';
import { formatAmount } from '../utils/hathor';
import htrLogoBlack from '../assets/htr_logo_black.svg';
import htrLogoWhite from '../assets/htr_logo_white.svg';
import htrLogoWhiteOutline from '../assets/htr_logo_white_outline.svg';
import { useToast } from '@/hooks/use-toast';

const WalletHome: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  } = useWallet();

  // Derive dialog states and filter from URL search params
  const dialog = searchParams.get('dialog');
  const tokenUid = searchParams.get('token');
  const filterParam = searchParams.get('filter') as 'all' | 'tokens' | 'nfts' | null;

  // Use filter from URL or default to 'tokens'
  const selectedTokenFilter = filterParam || 'tokens';

  const { tokens, tokenCount, nftCount, customTokenCount } = useTokens(selectedTokenFilter);
  const { toast } = useToast();

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
      setError(null); // Clear error after showing toast
    }
  }, [error, toast, setError]);

  // Show transaction toast when new transaction arrives
  useEffect(() => {
    if (!newTransaction) return;

    // Check if this is a notification (not for history dialog)
    const tx = newTransaction as Record<string, unknown>;
    if (tx.tx_id) {
      return; // This is for history dialog, not notification
    }

    const notification = tx as { type: 'sent' | 'received'; amount: bigint; timestamp: number; symbol: string; tokenUid: string };
    const isReceived = notification.type === 'received';
    const symbol = notification.symbol || 'HTR';

    toast({
      variant: isReceived ? 'success' : 'info',
      title: `${isReceived ? 'Received' : 'Sent'} ${symbol}`,
      description: `${isReceived ? '+' : '-'}${formatAmount(notification.amount, false)} ${symbol}`,
      icon: (
        <div className={`p-1.5 rounded-lg ${isReceived ? 'bg-green-500/20' : 'bg-blue-500/20'} flex-shrink-0`}>
          {isReceived ? (
            <ArrowDownLeft className={`w-4 h-4 ${isReceived ? 'text-green-400' : 'text-blue-400'}`} />
          ) : (
            <ArrowUpRight className={`w-4 h-4 text-blue-400`} />
          )}
        </div>
      ),
      action: (
        <button
          onClick={() => {
            clearNewTransaction();
            navigate(`?dialog=history&token=${notification.tokenUid}`);
          }}
          className={`text-xs ${isReceived ? 'text-green-400' : 'text-blue-400'} hover:underline flex items-center gap-1 mt-2`}
        >
          <Eye className='w-3 h-3' />
          View History
        </button>
      ),
    });

    clearNewTransaction();
  }, [newTransaction, toast, clearNewTransaction, navigate]);

  const sendDialogOpen = dialog === 'send';
  const receiveDialogOpen = dialog === 'receive';
  const historyDialogOpen = dialog === 'history';
  const registerTokenOpen = dialog === 'register';
  const createTokenOpen = dialog === 'create';
  const addressModeOpen = dialog === 'addressMode';

  // Helper to update search params while preserving existing ones
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    const queryString = newParams.toString();
    navigate(queryString ? `?${queryString}` : '/', { replace: false });
  };


  // Helper function to close dialogs
  const closeDialog = () => {
    navigate('/');
  };

  // Show loading screen while checking connection
  if (isCheckingConnection) {
    return (
      <div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>
        <div className='text-center space-y-6'>
          <div className='w-16 h-16 flex items-center justify-center mx-auto'>
            <img
              src={htrLogoWhite}
              alt='Hathor'
              className='w-full h-full'
            />
          </div>
          <div>
            <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4' />
            <p className='text-muted-foreground'>{loadingStep}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show connection screen if not connected
  if (!isConnected) {
    return (
      <div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>
        <div className='text-center space-y-6'>
          <div className='w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto p-4 shadow-xl'>
            <img
              src={htrLogoBlack}
              alt='Hathor'
              className='w-full h-full object-contain'
            />
          </div>
          <div>
            <h1 className='text-2xl font-medium mb-2'>Connect to Hathor Wallet</h1>
            <p className='text-muted-foreground mb-6'>
              Connect your MetaMask with Hathor Snap to get started
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className='px-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto'
            >
              {isConnecting ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
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
    <div className='min-h-screen bg-[#0d1117] text-white'>
      <Header
        onRegisterTokenClick={() => navigate('?dialog=register')}
        onCreateTokenClick={() => navigate('?dialog=create')}
        onAddressModeClick={() => navigate('?dialog=addressMode')}
      />

      {/* Main Container - responsive layout */}
      <div className='max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6 md:py-9 space-y-8 md:space-y-20'>
        {/* Assets Summary Card */}
        <div className='bg-[#191C21] border border-[#24292F] rounded-2xl p-4 md:p-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0'>
            {/* Left: Assets Info */}
            <div className='space-y-2'>
              <p className='text-xs text-primary-400 uppercase tracking-wider'>assets summary</p>
              <div className='flex items-center gap-3'>
                {/* HTR Icon */}
                <img
                  src={htrLogoWhiteOutline}
                  alt='HTR'
                  className='w-5 h-5 md:w-6 md:h-6'
                />
                <span className='text-xl md:text-2xl font-medium text-white'>
                  {formatAmount(balances.get('00')?.available ?? 0n, false)} HTR
                </span>
              </div>
              {/* Show custom token and NFT counts */}
              {(customTokenCount > 0 || nftCount > 0) && (
                <p className='text-xs text-muted-foreground'>
                  You also have {customTokenCount > 0 && `${customTokenCount} custom token${customTokenCount > 1 ? 's' : ''}`}
                  {customTokenCount > 0 && nftCount > 0 && ' and '}
                  {nftCount > 0 && `${nftCount} NFT${nftCount > 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className='flex gap-3 w-full md:w-auto'>
              <button
                onClick={() => navigate('?dialog=send')}
                className='flex-1 md:flex-none px-6 py-2.5 bg-primary hover:bg-primary/90 active:bg-primary/80 rounded-xl flex items-center justify-center gap-2 transition-colors'
              >
                <ArrowUpRight className='w-4 h-4 text-white' />
                <span className='text-sm font-medium text-white'>Send</span>
              </button>
              <button
                onClick={() => navigate('?dialog=receive')}
                className='flex-1 md:flex-none px-6 py-2.5 bg-primary hover:bg-primary/90 active:bg-primary/80 rounded-xl flex items-center justify-center gap-2 transition-colors'
              >
                <ArrowDownLeft className='w-4 h-4 text-white' />
                <span className='text-sm font-medium text-white'>Receive</span>
              </button>
            </div>
          </div>
        </div>

        {/* My Assets Section */}
        <div className='space-y-6'>
          {/* Section Header */}
          <h2 className='text-xl font-medium text-white'>My Assets</h2>

          {/* Token Tabs */}
          <TokenTabs
            selectedFilter={selectedTokenFilter}
            onFilterChange={(filter) => updateSearchParams({ filter })}
            tokenCount={tokenCount}
            nftCount={nftCount}
          />

          {/* Token List */}
          <TokenList
            tokens={tokens}
            onTokenClick={(tokenUid) => {
              navigate(`?dialog=history&token=${tokenUid}`);
            }}
            onSendClick={(tokenUid) => {
              navigate(`?dialog=send&token=${tokenUid}`);
            }}
          />
        </div>
      </div>

      {/* Dialogs */}
      <SendDialog
        isOpen={sendDialogOpen}
        onClose={closeDialog}
        initialTokenUid={tokenUid || undefined}
      />
      <ReceiveDialog
        isOpen={receiveDialogOpen}
        onClose={closeDialog}
      />
      <HistoryDialog
        isOpen={historyDialogOpen}
        onClose={closeDialog}
        tokenUid={tokenUid || undefined}
        onRegisterTokenClick={() => navigate('?dialog=register')}
      />
      <RegisterTokenDialog
        isOpen={registerTokenOpen}
        onClose={closeDialog}
      />
      <CreateTokenDialog
        isOpen={createTokenOpen}
        onClose={closeDialog}
      />
      <AddressModeDialog
        isOpen={addressModeOpen}
        onClose={closeDialog}
      />
    </div>
  );
};

export default WalletHome;
