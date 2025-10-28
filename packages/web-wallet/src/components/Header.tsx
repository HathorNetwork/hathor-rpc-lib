import React, { useState } from 'react';
import { Copy, Globe } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { truncateAddress } from '../utils/hathor';
import ChangeNetworkDialog from './ChangeNetworkDialog';
import htrLogo from '../htr_logo.svg';

const Header: React.FC = () => {
  const { address, network } = useWallet();
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const getNetworkDisplayName = (networkId: string) => {
    switch (networkId) {
      case 'mainnet':
        return 'Mainnet';
      case 'testnet':
        return 'Testnet';
      case 'dev-testnet':
        return 'Dev Testnet';
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
          <div className="flex items-center gap-3">
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

            {/* Menu Button - Hidden for now */}
            {/* <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 bg-[#191C21] border border-[#24292F] rounded-full hover:bg-[#24292F] transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-white" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#191C21] border border-[#24292F] rounded-lg shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setIsNetworkDialogOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"
                  >
                    Create Tokens
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"
                  >
                    Notifications
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#24292F] transition-colors"
                  >
                    Address mode
                  </button>
                </div>
              )}
            </div> */}
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
