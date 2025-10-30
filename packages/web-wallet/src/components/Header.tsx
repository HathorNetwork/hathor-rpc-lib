import React, { useState } from 'react';
import { Copy, Globe, Menu, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { truncateAddress } from '../utils/hathor';
import ChangeNetworkDialog from './ChangeNetworkDialog';
import htrLogo from '../htr_logo.svg';
import { NETWORKS } from '../constants';

interface HeaderProps {
  onRegisterTokenClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRegisterTokenClick }) => {
  const { address, network } = useWallet();
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
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
      <header>
        <div className="max-w-7xl mx-auto px-16 py-6 flex items-center justify-between">
          {/* Left: Logo + Badge */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img
                src={htrLogo}
                alt="Hathor"
                className="h-5"
              />
              <div className="px-[6px] py-[6px] bg-transparent border border-white/20 rounded-full flex items-center">
                <span className="text-[9px] font-medium text-white tracking-wider leading-none">WEB WALLET</span>
              </div>
            </div>
          </div>

          {/* Right: Address + Network + Menu */}
          <div className="flex items-center gap-3 relative">
            {/* Wallet Address */}
            <button
              onClick={handleCopyAddress}
              className="px-3 py-2 bg-[#191C21] border border-[#24292F] rounded-full flex items-center gap-2 hover:bg-[#24292F] transition-colors"
            >
              <span className="text-sm font-mono text-white">
                {address ? truncateAddress(address) : 'Not connected'}
              </span>
              {address && <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>

            {/* Network Button */}
            <button
              onClick={() => setIsNetworkDialogOpen(true)}
              className="px-4 py-2 bg-[#191C21] border border-[#24292F] rounded-full flex items-center gap-2 hover:bg-[#24292F] transition-colors"
            >
              <Globe className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {getNetworkDisplayName(network)}
              </span>
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-[#191C21] border border-[#24292F] rounded-full hover:bg-[#24292F] transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#191C21] border border-[#24292F] rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRegisterTokenClick?.();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"
                >
                  Register token
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm text-muted-foreground hover:bg-[#24292F] transition-colors"
                  disabled
                >
                  Address book
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm text-muted-foreground hover:bg-[#24292F] transition-colors"
                  disabled
                >
                  Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Network Dialog */}
      <ChangeNetworkDialog
        isOpen={isNetworkDialogOpen}
        onClose={() => setIsNetworkDialogOpen(false)}
      />
    </>
  );
};

export default Header;
