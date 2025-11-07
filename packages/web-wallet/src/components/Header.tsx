import React, { useState } from 'react';
import { Copy, Globe, Menu, X, Check, LogOut } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { truncateAddress } from '../utils/hathor';
import ChangeNetworkDialog from './ChangeNetworkDialog';
import { DisconnectConfirmModal } from './DisconnectConfirmModal';
import htrLogo from '../htr_logo.svg';
import { NETWORKS } from '../constants';

interface HeaderProps {
  onRegisterTokenClick?: () => void;
  onCreateTokenClick?: () => void;
  onAddressModeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRegisterTokenClick, onCreateTokenClick, onAddressModeClick }) => {
  const { address, network, disconnectWallet } = useWallet();
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

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
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
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
    // Page will reload automatically via state reset
    window.location.reload();
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

  return (
    <>
      {/* Toast Notification */}
      {copiedAddress && (
        <div className="fixed bottom-4 right-4 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#191C21] rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-white">Copied to clipboard</p>
          </div>
        </div>
      )}

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
                <span className="text-[8px] md:text-[9px] font-medium text-white tracking-wider leading-none">WEB WALLET</span>
              </div>
            </div>

            {/* Address + Network + Menu */}
            <div className="flex items-center justify-center gap-2 md:gap-3 md:relative">
              {/* Wallet Address */}
              <button
                onClick={handleCopyAddress}
                className="px-3 md:px-4 py-2 bg-[#191C21] border border-[#24292F] rounded-full flex items-center gap-1 md:gap-2 hover:bg-[#24292F] transition-colors group"
              >
                <span className="text-xs md:text-sm font-mono text-white">
                  {address ? truncateAddress(address) : 'Not connected'}
                </span>
                {address && <Copy className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
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
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCreateTokenClick?.();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"
                  >
                    Create Tokens
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRegisterTokenClick?.();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"
                  >
                    Register Tokens
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onAddressModeClick?.();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"
                  >
                    Address mode
                  </button>
                  <div className="border-t border-[#24292F] my-1" />
                  <button
                    onClick={handleDisconnectClick}
                    className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-[#24292F] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
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
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onCreateTokenClick?.();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] rounded-lg transition-colors"
              >
                Create Tokens
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onRegisterTokenClick?.();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] rounded-lg transition-colors"
              >
                Register Tokens
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onAddressModeClick?.();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] rounded-lg transition-colors"
              >
                Address mode
              </button>
              <div className="border-t border-[#24292F] my-2" />
              <button
                onClick={handleDisconnectClick}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-[#24292F] rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
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
