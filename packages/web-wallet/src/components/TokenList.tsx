import React from 'react';
import { ArrowUpRight, Music, Video, FileText, File } from 'lucide-react';
import type { TokenInfo } from '../types/token';
import { formatHTRAmount, truncateAddress } from '../utils/hathor';

type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'PDF' | 'UNKNOWN';

const getMediaType = (token: TokenInfo): MediaType => {
  if (!token.metadata?.nft_media) return 'UNKNOWN';

  const { type } = token.metadata.nft_media;

  // Use the type field directly from the API
  if (type) {
    const typeUpper = type.toUpperCase() as MediaType;
    if (['IMAGE', 'AUDIO', 'VIDEO', 'PDF'].includes(typeUpper)) {
      return typeUpper;
    }
  }

  return 'UNKNOWN';
};

interface NFTMediaThumbnailProps {
  token: TokenInfo;
}

const NFTMediaThumbnail: React.FC<NFTMediaThumbnailProps> = ({ token }) => {
  const [imageError, setImageError] = React.useState(false);
  const mediaType = getMediaType(token);
  const file = token.metadata?.nft_media?.file;

  // Render icon for non-image types (or missing file)
  const iconClassName = "w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#24292F] border border-[#3A4149] flex items-center justify-center text-muted-foreground";

  // Render actual image for image types with valid file
  if (mediaType === 'IMAGE' && file && !imageError) {
    return (
      <img
        src={file}
        alt={token.name}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  // Render appropriate icon based on media type
  switch (mediaType) {
    case 'AUDIO':
      return (
        <div className={iconClassName}>
          <Music className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      );
    case 'VIDEO':
      return (
        <div className={iconClassName}>
          <Video className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      );
    case 'PDF':
      return (
        <div className={iconClassName}>
          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      );
    default:
      // For UNKNOWN or missing media, show generic file icon
      return (
        <div className={iconClassName}>
          <File className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      );
  }
};

interface TokenListProps {
  tokens: TokenInfo[];
  onTokenClick: (tokenUid: string) => void;
  onSendClick: (tokenUid: string) => void;
}

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  onTokenClick,
  onSendClick,
}) => {
  const handleSendClick = (tokenUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSendClick(tokenUid);
  };

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No tokens to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tokens.map((token) => {
        return (
          <div
            key={token.uid}
            onClick={() => onTokenClick(token.uid)}
            className="w-full bg-[#191C21] border border-[#24292F] rounded-lg px-4 md:px-6 py-4 md:py-6 hover:bg-primary-600/40 transition-colors group min-h-[100px] md:min-h-[112px] cursor-pointer"
          >
            {/* Outer container - single row on desktop, stacked on mobile */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              {/* Left side: Token Info + Balance (side by side on mobile) */}
              <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4 min-w-0 flex-1">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  {/* NFT Media Thumbnail - show for all NFTs, even without media */}
                  {token.isNFT && <NFTMediaThumbnail token={token} />}

                  {/* Token Info */}
                  <div className="space-y-1 text-left min-w-0 flex-1">
                    <div className="text-sm md:text-base font-medium text-white truncate">{token.symbol}</div>
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {token.isNFT ? truncateAddress(token.uid) : token.name}
                    </div>
                  </div>
                </div>

                {/* Balance - aligned right on mobile, integrated in left side */}
                <span className="text-base md:text-lg font-medium text-white flex-shrink-0 md:ml-4">
                  {token.balance ? formatHTRAmount(token.balance.available, token.isNFT) : '0'} {token.symbol}
                </span>
              </div>

              {/* Right side: Action Buttons */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Send Button */}
                <button
                  onClick={(e) => handleSendClick(token.uid, e)}
                  className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-[#191C21] border border-border hover:bg-[#24292F] text-white rounded-lg text-xs md:text-sm flex items-center justify-center gap-1 md:gap-2 transition-colors"
                >
                  <span>Send</span>
                  <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TokenList;
