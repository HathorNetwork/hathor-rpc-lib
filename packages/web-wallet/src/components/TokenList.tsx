import React from 'react';
import { ArrowUpRight, Music, Video, FileText, File, ExternalLink } from 'lucide-react';
import type { TokenInfo } from '../types/token';
import { formatHTRAmount } from '../utils/hathor';
import { TOKEN_IDS } from '../constants';

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
  const iconClassName = "w-16 h-16 rounded-lg bg-[#24292F] border border-[#3A4149] flex items-center justify-center text-muted-foreground";

  // Render actual image for image types with valid file
  if (mediaType === 'IMAGE' && file && !imageError) {
    return (
      <img
        src={file}
        alt={token.name}
        className="w-16 h-16 rounded-lg object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  // Render appropriate icon based on media type
  switch (mediaType) {
    case 'AUDIO':
      return (
        <div className={iconClassName}>
          <Music className="w-8 h-8" />
        </div>
      );
    case 'VIDEO':
      return (
        <div className={iconClassName}>
          <Video className="w-8 h-8" />
        </div>
      );
    case 'PDF':
      return (
        <div className={iconClassName}>
          <FileText className="w-8 h-8" />
        </div>
      );
    default:
      // For UNKNOWN or missing media, show generic file icon
      return (
        <div className={iconClassName}>
          <File className="w-8 h-8" />
        </div>
      );
  }
};

interface TokenListProps {
  tokens: TokenInfo[];
  onTokenClick: (tokenUid: string) => void;
  onSendClick: (tokenUid: string) => void;
  network: string;
}

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  onTokenClick,
  onSendClick,
  network,
}) => {
  const handleSendClick = (tokenUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSendClick(tokenUid);
  };

  const handleViewDetails = (tokenUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const explorerBaseUrl = network === 'mainnet'
      ? 'https://explorer.hathor.network'
      : 'https://explorer.testnet.hathor.network';
    window.open(`${explorerBaseUrl}/token_detail/${tokenUid}`, '_blank');
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
          <button
            key={token.uid}
            onClick={() => onTokenClick(token.uid)}
            className="w-full bg-[#191C21] border border-[#24292F] rounded-lg px-6 py-8 flex items-center justify-between hover:bg-primary-600/40 transition-colors group"
          >
            <div className="flex items-center gap-4">
              {/* NFT Media Thumbnail - show for all NFTs, even without media */}
              {token.isNFT && <NFTMediaThumbnail token={token} />}

              {/* Token Info */}
              <div className="space-y-1 text-left">
                <div className="text-base font-medium text-white">{token.symbol}</div>
                <div className="text-sm text-muted-foreground">{token.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-lg font-medium text-white">
                {formatHTRAmount(token.balance.available)}
              </span>

              {/* View Details Button - hide for HTR token */}
              {token.uid !== TOKEN_IDS.HTR && (
                <button
                  onClick={(e) => handleViewDetails(token.uid, e)}
                  className="px-4 py-2 bg-[#191C21] border border-border hover:bg-[#24292F] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <span>View details</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}

              {/* Send Button */}
              <button
                onClick={(e) => handleSendClick(token.uid, e)}
                className="px-4 py-2 bg-[#191C21] border border-border hover:bg-[#24292F] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <span>Send</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TokenList;
