import React, { useState, useEffect } from 'react';
import { Copy, Globe, Menu, X, LogOut } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { truncateString } from '../utils/hathor';
import ChangeNetworkDialog from './ChangeNetworkDialog';
import { DisconnectConfirmModal } from './DisconnectConfirmModal';
import htrLogo from '../htr_logo.svg';
import { NETWORKS } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { readOnlyWalletWrapper } from '../services/ReadOnlyWalletWrapper';

interface HeaderProps {
  onRegisterTokenClick?: () => void;
  onCreateTokenClick?: () => void;
  // TODO: Re-enable when address mode switching logic is finalized
  // onAddressModeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRegisterTokenClick, onCreateTokenClick }) => {
  const { isConnected, network, disconnectWallet } = useWallet();
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [firstAddress, setFirstAddress] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch first address (index 0) when connected
  useEffect(() => {
    if (!isConnected || !readOnlyWalletWrapper.isReady()) {
      setFirstAddress(null);
      return;
    }

    const fetchFirstAddress = async () => {
      try {
        const addressInfo = await readOnlyWalletWrapper.getAddressAtIndex(0);
        if (addressInfo) {
          setFirstAddress(addressInfo.address);
        }
      } catch (error) {
        console.error('Failed to fetch first address:', error);
      }
    };

    fetchFirstAddress();
  }, [isConnected]);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleCopyAddress = async () => {
    if (firstAddress) {
      try {
        await navigator.clipboard.writeText(firstAddress);
        toast({
          variant: "success",
          title: "Copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleDisconnectClick = () => {
    setIsDisconnectModalOpen(true);
  };

  const handleDisconnect = () => {
    setIsMenuOpen(false);
    setIsDisconnectModalOpen(false);
    disconnectWallet();
  };

  const getNetworkDisplayName = (networkId: string) => {
    switch (networkId) {
      case NETWORKS.MAINNET:
        return 'Mainnet';
      case NETWORKS.TESTNET:
        return 'Testnet';
      default:
        return networkId;
    }
  };

  // Shared menu items to avoid duplication between desktop and mobile
  const MenuItems = ({ className = '' }: { className?: string }) => (
    <>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          onCreateTokenClick?.();
        }}
        className={className || "w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"}
      >
        Create Tokens
      </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          onRegisterTokenClick?.();
        }}
        className={className || "w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"}
      >
        Register Tokens
      </button>
      {/* TODO: Re-enable when address mode switching logic is finalized
      <button
        onClick={() => {
          setIsMenuOpen(false);
          onAddressModeClick?.();
        }}
        className={className || "w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"}
      >
        Address mode
      </button>
      */}
      <div className="border-t border-[#24292F] my-1 md:my-2" />
      <button
        onClick={handleDisconnectClick}
        className={(className || "w-full px-4 py-3 text-left text-sm hover:bg-[#24292F] transition-colors") + " text-red-400 flex items-center gap-2"}
      >
        <LogOut className="w-4 h-4" />
        Disconnect
      </button>
    </>
  );

  return (
    <>
      <header>
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-4 md:py-6">
          {/* Mobile: Stacked layout, Desktop: Side by side */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Logo + Badge */}
            <div className="flex items-center justify-center md:justify-start gap-2">
              <img
                src={htrLogo}
                alt="Hathor"
                className="h-4 md:h-5"
              />
              <div className="px-[6px] py-[6px] bg-transparent border border-white/20 rounded-full flex items-center">
                <span className="text-[8px] md:text-[9px] font-medium text-white tracking-wider leading-none">WEB WALLET v{process.env.WALLET_VERSION}</span>
              </div>
            </div>

            {/* Address + Network + Menu */}
            <div className="flex items-center justify-center gap-2 md:gap-3 md:relative">
              {/* Wallet Address (always shows first address) */}
              <button
                onClick={handleCopyAddress}
                title={firstAddress ? 'First address of your wallet (click to copy)' : undefined}
                className="px-3 md:px-4 py-2 bg-[#191C21] border border-[#24292F] rounded-full flex items-center gap-1 md:gap-2 hover:bg-[#24292F] transition-colors group"
              >
                <span className="text-xs md:text-sm font-mono text-white">
                  {firstAddress ? truncateString(firstAddress) : 'Not connected'}
                </span>
                {firstAddress && <Copy className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
              </button>

              {/* Network Button */}
              <button
                onClick={() => setIsNetworkDialogOpen(true)}
                className="px-3 md:px-5 py-2 bg-[#191C21] border border-[#24292F] rounded-full flex items-center gap-1 md:gap-2 hover:bg-[#24292F] transition-colors"
              >
                <Globe className="w-3 h-3 md:w-4 md:h-4 text-white" />
                <span className="text-xs md:text-sm font-medium text-white">
                  {getNetworkDisplayName(network)}
                </span>
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 bg-[#191C21] border border-[#24292F] rounded-full hover:bg-[#24292F] transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                ) : (
                  <Menu className="w-4 h-4 md:w-5 md:h-5 text-white" />
                )}
              </button>

              {/* Desktop: Compact dropdown - only on desktop, stays in relative container */}
              {isMenuOpen && (
                <div className="hidden md:block absolute top-full right-0 mt-2 w-48 bg-[#191C21] border border-[#24292F] rounded-lg shadow-lg overflow-hidden z-50">
                  <MenuItems />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Backdrop + Panel (rendered outside header to prevent layout shift) */}
      {isMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed left-4 right-4 top-[calc(100px+0.75rem)] bg-[#191C21] border border-[#24292F] rounded-xl shadow-lg z-50">
            <div className="px-4 py-2">
              <MenuItems className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] rounded-lg transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Change Network Dialog */}
      <ChangeNetworkDialog
        isOpen={isNetworkDialogOpen}
        onClose={() => setIsNetworkDialogOpen(false)}
      />

      {/* Disconnect Confirmation Modal */}
      <DisconnectConfirmModal
        isOpen={isDisconnectModalOpen}
        onDisconnect={handleDisconnect}
        onCancel={() => setIsDisconnectModalOpen(false)}
      />
    </>
  );
};

export default Header;
