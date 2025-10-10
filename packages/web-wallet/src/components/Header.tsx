import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { truncateAddress } from '../utils/hathor';
import htrLogo from '../htr_logo.svg';

const Header: React.FC = () => {
  const { address } = useWallet();

  return (
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

        {/* Right: Wallet Address */}
        <div className="px-3 py-2 bg-[#191C21] border border-[#24292F] rounded-full flex items-center gap-2">
          <span className="text-sm font-mono text-white">
            {address ? truncateAddress(address) : 'Not connected'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
