import React, { useState } from 'react';
import { X, AlertCircle, ChevronDown } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { NETWORKS, WALLET_SERVICE_URLS } from '../constants';

interface ChangeNetworkDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const NETWORK_OPTIONS = [
  {
    id: NETWORKS.MAINNET,
    name: 'Mainnet',
    url: WALLET_SERVICE_URLS.MAINNET,
  },
  {
    id: NETWORKS.TESTNET,
    name: 'Testnet',
    url: WALLET_SERVICE_URLS.TESTNET,
  },
];

const ChangeNetworkDialog: React.FC<ChangeNetworkDialogProps> = ({ isOpen, onClose }) => {
  const { network, changeNetwork } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState(network);

  const handleChangeNetwork = async () => {
    if (selectedNetwork === network) {
      onClose();
      return;
    }

    await changeNetwork(selectedNetwork);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md my-4 md:my-0 md:mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-[#24292F]">
          <h2 className="text-lg font-bold text-primary-400">Change network</h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-white text-sm">
              This is where you can switch your Hathor Wallet network.
            </p>
            <p className="text-white text-sm">
              Make sure you understand the risks before continuing.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <p className="text-sm text-white">
              Changing the network can expose your wallet to risks. Only proceed if you know what
              you're doing; never switch networks based on third-party suggestions, as this may lead
              to fraud.
            </p>
          </div>

          {/* Network Selection */}
          <div className="space-y-3">
            <label className="block text-base font-bold text-white">
              Choose network
            </label>
            <div className="relative">
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full px-4 py-3 pr-10 bg-[#0D1117] border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                {NETWORK_OPTIONS.map((networkOption) => (
                  <option key={networkOption.id} value={networkOption.id}>
                    {networkOption.name} ({networkOption.url})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Change Network Button */}
          <div className="flex justify-center">
            <button
              onClick={handleChangeNetwork}
              className="px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Change network
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeNetworkDialog;
