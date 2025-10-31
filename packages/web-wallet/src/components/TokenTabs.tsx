import React from 'react';
import type { TokenFilter } from '../types/token';

interface TokenTabsProps {
  selectedFilter: TokenFilter;
  onFilterChange: (filter: TokenFilter) => void;
  tokenCount: number;
  nftCount: number;
}

const TokenTabs: React.FC<TokenTabsProps> = ({
  selectedFilter,
  onFilterChange,
  tokenCount,
  nftCount,
}) => {
  const tabs = [
    {
      id: 'tokens' as TokenFilter,
      label: 'Tokens',
      count: tokenCount,
    },
    {
      id: 'nfts' as TokenFilter,
      label: 'NFT',
      count: nftCount,
    },
  ];

  return (
    <div className="flex border-b border-[#24292F]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className={`flex-1 pb-4 px-1 relative transition-colors ${
            selectedFilter === tab.id
              ? 'text-primary-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <span className="text-base font-medium">
            {tab.label}
          </span>
          {/* Active indicator */}
          {selectedFilter === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
          )}
        </button>
      ))}
    </div>
  );
};

export default TokenTabs;
