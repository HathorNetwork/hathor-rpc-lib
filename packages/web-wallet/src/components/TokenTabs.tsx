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
}) => {
  const tabs = [
    {
      id: 'tokens' as TokenFilter,
      label: 'Tokens'
    },
    {
      id: 'nfts' as TokenFilter,
      label: 'NFT'
    },
  ];

  return (
    <div className="flex border-b border-[#24292F]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className={`flex-1 pb-3 md:pb-4 px-1 relative transition-all group ${
            selectedFilter === tab.id
              ? 'text-primary-400'
              : 'text-muted-foreground hover:text-primary-400'
          }`}
        >
          <span className="text-sm md:text-base font-medium">
            {tab.label}
          </span>
          {/* Active indicator */}
          {selectedFilter === tab.id ? (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
          ) : (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400/0 group-hover:bg-primary-400/40 transition-all" />
          )}
        </button>
      ))}
    </div>
  );
};

export default TokenTabs;
