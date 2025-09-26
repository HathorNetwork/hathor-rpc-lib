import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Wallet, AlertTriangle, Loader2 } from 'lucide-react';
import SendDialog from './SendDialog';
import ReceiveDialog from './ReceiveDialog';
import HistoryDialog from './HistoryDialog';
import { useWallet } from '../contexts/WalletContext';
import { formatHTRAmount, truncateAddress } from '../utils/hathor';

const ProperWalletHome: React.FC = () => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  const { 
    isConnected, 
    isConnecting,
    isCheckingConnection,
    loadingStep, 
    address, 
    balances, 
    network, 
    error, 
    connectWallet, 
    refreshBalance,
    setError 
  } = useWallet();

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
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto p-4">
            <img 
              src="/icon.svg" 
              alt="Hathor" 
              className="w-full h-full"
            />
          </div>
          <div>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{loadingStep}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show connection screen if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto p-4">
            <img 
              src="/icon.svg" 
              alt="Hathor" 
              className="w-full h-full"
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
      {/* Main Container - responsive layout */}
      <div className="max-w-7xl mx-auto px-16 py-9 space-y-20">
        
        {/* Header Section */}
        <header className="flex items-center justify-between">
          {/* Left: Logo + Badge */}
          <div className="flex items-center gap-6">
            {/* Hathor Logo */}
            <div className="flex items-center gap-2">
              <img 
                src="/logo.svg" 
                alt="Hathor" 
                className="h-7"
              />
              
              {/* WEB WALLET Badge */}
              <div className="px-2 py-1 bg-transparent border border-white/20 rounded-full">
                <span className="text-xs font-medium text-white">WEB WALLET</span>
              </div>
            </div>
          </div>

          {/* Right: Wallet Address */}
          <div className="px-3 py-2 bg-card border border-border rounded-full flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
              <Wallet className="w-3 h-3 text-background" />
            </div>
            <span className="text-sm font-mono text-white">
              {address ? truncateAddress(address) : 'Not connected'}
            </span>
            <ExternalLink className="w-3 h-3 text-muted" />
          </div>
        </header>

        {/* Assets Summary Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            {/* Left: Assets Info */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">assets summary</p>
              <div className="flex items-center gap-3">
                {/* HTR Icon placeholder */}
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">H</span>
                </div>
                <span className="text-2xl font-medium text-white">
                  {(() => {
                    console.log('🎨 UI rendering balance. balances array:', balances);
                    if (balances.length > 0) {
                      console.log('💰 First balance item:', balances[0]);
                      console.log('🔢 Available amount:', balances[0].available);
                      console.log('📱 Formatted amount:', formatHTRAmount(balances[0].available));
                      return `${formatHTRAmount(balances[0].available)} HTR`;
                    }
                    return '0 HTR';
                  })()}
                </span>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleButtonClick('Send')}
                className={`px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-2xl flex items-center gap-2 transition-colors ${
                  activeButton === 'Send' ? 'bg-secondary/80' : ''
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Send</span>
              </button>
              <button 
                onClick={() => handleButtonClick('Receive')}
                className={`px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-2xl flex items-center gap-2 transition-colors ${
                  activeButton === 'Receive' ? 'bg-secondary/80' : ''
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-white">My Assets</h2>
            <button 
              onClick={() => handleButtonClick('ViewHistory')}
              className={`px-3 py-2 bg-transparent hover:bg-secondary/20 rounded flex items-center gap-2 transition-colors ${
                activeButton === 'ViewHistory' ? 'bg-secondary/20' : ''
              }`}
            >
              <ExternalLink className="w-3 h-3 text-white" />
              <span className="text-sm text-white">View full history</span>
            </button>
          </div>

          {/* Assets Card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* HTR Row */}
            <div className="px-5 py-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-lg font-medium text-white">HTR</div>
                <div className="text-sm text-muted-foreground">Hathor</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium text-white">
                  {balances.length > 0 ? formatHTRAmount(balances[0].available) : '0.00'}
                </span>
                <button 
                  onClick={() => handleButtonClick('SendHTR')}
                  className={`px-3 py-2 bg-transparent border border-border hover:bg-secondary/20 rounded flex items-center gap-2 transition-colors ${
                    activeButton === 'SendHTR' ? 'bg-secondary/20' : ''
                  }`}
                >
                  <span className="text-xs text-white">Send</span>
                  <ArrowUpRight className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Warning Message */}
            <div className="px-5 py-3 bg-secondary/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                HTR is the only supported token in this version. Support for custom tokens is coming soon.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SendDialog 
        isOpen={sendDialogOpen} 
        onClose={() => setSendDialogOpen(false)} 
      />
      <ReceiveDialog 
        isOpen={receiveDialogOpen} 
        onClose={() => setReceiveDialogOpen(false)} 
      />
      <HistoryDialog 
        isOpen={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)} 
      />
    </div>
  );
};

export default ProperWalletHome;