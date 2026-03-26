import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { tokensUtils } from '@hathor/wallet-lib';
import { truncateString } from '../utils/hathor';
import { HATHOR_EXPLORER_URLS, NETWORKS } from '../constants';
import { tokenDiscoveryService, type DiscoveredToken } from '../services/TokenDiscoveryService';

const BATCH_SIZE = 2;
const BATCH_INTERVAL_MS = 500;

type DialogStep = 'select' | 'confirm' | 'success';

interface ImportTokensDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function useThrottledQueue(
  onProcess: (uid: string) => Promise<void>,
) {
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processNext = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;
    isProcessingRef.current = true;

    const batch = queueRef.current.splice(0, BATCH_SIZE);
    await Promise.allSettled(batch.map(uid => onProcess(uid)));

    isProcessingRef.current = false;

    if (queueRef.current.length > 0) {
      timerRef.current = setTimeout(processNext, BATCH_INTERVAL_MS);
    }
  }, [onProcess]);

  const enqueue = useCallback((uids: string[]) => {
    const existing = new Set(queueRef.current);
    const newUids = uids.filter(uid => !existing.has(uid));
    queueRef.current.push(...newUids);
    processNext();
  }, [processNext]);

  const clear = useCallback(() => {
    queueRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { enqueue, clear };
}

const ImportTokensDialog: React.FC<ImportTokensDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { registerTokensBatch, network } = useWallet();
  const navigate = useNavigate();
  const { discoveredTokenUids, refreshDiscovery } = useOutletContext<{
    discoveredTokenUids: string[];
    refreshDiscovery: () => Promise<void>;
  }>();

  const [step, setStep] = useState<DialogStep>('select');
  const [tokenDetails, setTokenDetails] = useState<Map<string, DiscoveredToken>>(new Map());
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const explorerBaseUrl = network === NETWORKS.MAINNET
    ? HATHOR_EXPLORER_URLS.MAINNET
    : HATHOR_EXPLORER_URLS.TESTNET;

  // Lazy load token details
  const fetchDetail = useCallback(async (uid: string) => {
    if (tokenDetails.has(uid)) return;

    const detail = await tokenDiscoveryService.fetchTokenDetails(uid);
    if (detail) {
      setTokenDetails(prev => {
        const next = new Map(prev);
        next.set(uid, detail);
        return next;
      });
    }
  }, [tokenDetails]);

  const { enqueue, clear } = useThrottledQueue(fetchDetail);

  useEffect(() => {
    if (!isOpen || discoveredTokenUids.length === 0) return;
    const initialBatch = discoveredTokenUids.slice(0, 6);
    enqueue(initialBatch);
    return () => clear();
  }, [isOpen, discoveredTokenUids, enqueue, clear]);

  // Intersection observer for scroll-based lazy loading
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleUids: string[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const uid = (entry.target as HTMLElement).dataset.tokenUid;
            if (uid && !tokenDetails.has(uid)) {
              visibleUids.push(uid);
            }
          }
        }
        if (visibleUids.length > 0) enqueue(visibleUids);
      },
      { root: scrollContainerRef.current, rootMargin: '100px', threshold: 0 }
    );

    const container = scrollContainerRef.current;
    if (container) {
      container.querySelectorAll('[data-token-uid]').forEach(row => observerRef.current?.observe(row));
    }
  }, [enqueue, tokenDetails]);

  useEffect(() => {
    if (!isOpen || discoveredTokenUids.length === 0) return;
    const timer = setTimeout(setupObserver, 100);
    return () => { clearTimeout(timer); observerRef.current?.disconnect(); };
  }, [isOpen, discoveredTokenUids, setupObserver]);

  const toggleToken = (uid: string) => {
    setSelectedTokens(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTokens.size === discoveredTokenUids.length) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens(new Set(discoveredTokenUids));
    }
  };

  const formatBalance = (token: DiscoveredToken): string => {
    if (!token.balance) return '...';
    const available = token.balance.available;
    const whole = available / 100n;
    const remainder = available % 100n;
    const decimal = remainder.toString().padStart(2, '0');
    return `${whole.toLocaleString()}.${decimal}`;
  };

  // Step 1 → Step 2: fetch any unloaded details for selected tokens, then show confirm
  const handleContinue = async () => {
    if (selectedTokens.size === 0) return;

    // Fetch details for unloaded selected tokens
    const unloadedUids = [...selectedTokens].filter(uid => !tokenDetails.has(uid));
    if (unloadedUids.length > 0) {
      const fetched = await Promise.allSettled(
        unloadedUids.map(uid => tokenDiscoveryService.fetchTokenDetails(uid))
      );
      for (const result of fetched) {
        if (result.status === 'fulfilled' && result.value) {
          setTokenDetails(prev => {
            const next = new Map(prev);
            next.set(result.value!.uid, result.value!);
            return next;
          });
          tokenDetails.set(result.value.uid, result.value);
        }
      }
    }

    setStep('confirm');
  };

  // Step 2 → Step 3: actually import
  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);

    const configStrings: string[] = [];
    const errors: string[] = [];

    for (const uid of selectedTokens) {
      const detail = tokenDetails.get(uid);
      if (!detail?.name || !detail?.symbol) {
        errors.push(`${uid.slice(0, 8)}...: could not load details`);
        continue;
      }
      configStrings.push(
        tokensUtils.getConfigurationString(detail.uid, detail.name, detail.symbol)
      );
    }

    if (configStrings.length > 0) {
      try {
        const result = await registerTokensBatch(configStrings);
        errors.push(...result.errors.map(e => e.error));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Import failed: ${msg}`);
      }
    }

    setIsImporting(false);
    refreshDiscovery();

    if (errors.length > 0) {
      setImportError(`Some tokens failed: ${errors.join(', ')}`);
    } else {
      setStep('success');
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    clear();
    setStep('select');
    setSelectedTokens(new Set());
    setImportError(null);
    onClose();
  };

  const isAllSelected = useMemo(
    () => discoveredTokenUids.length > 0 && selectedTokens.size === discoveredTokenUids.length,
    [discoveredTokenUids.length, selectedTokens.size]
  );

  // Get selected tokens with details for confirm screen
  const selectedTokenList = useMemo(() => {
    return [...selectedTokens]
      .map(uid => tokenDetails.get(uid))
      .filter((t): t is DiscoveredToken => !!t?.name);
  }, [selectedTokens, tokenDetails]);

  if (!isOpen) return null;

  // Token row component (reused in select + confirm screens)
  const TokenRow = ({ token, showCheckbox = false }: { token: DiscoveredToken; showCheckbox?: boolean }) => (
    <div className="flex items-center gap-3 p-3 bg-[#0D1117] border border-border rounded-lg">
      {showCheckbox && (
        <input
          type="checkbox"
          checked={selectedTokens.has(token.uid)}
          onChange={() => toggleToken(token.uid)}
          className="w-4 h-4 rounded border-border bg-[#0D1117] text-primary accent-primary flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">
          {token.symbol} ({token.name})
        </div>
        <div className="text-xs text-muted-foreground">
          {formatBalance(token)} {token.symbol}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-muted-foreground font-mono">
          {truncateString(token.uid, 5, 5)}
        </span>
        <a
          href={`${explorerBaseUrl}/token_detail/${token.uid}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`View ${token.symbol} on explorer`}
          className="p-0.5 hover:text-primary-400 text-muted-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div role="dialog" aria-labelledby="import-tokens-title" className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md my-4 md:my-0 md:mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-[#24292F]">
          <h2 id="import-tokens-title" className="text-base font-bold text-primary-400">
            {step === 'confirm' ? 'Confirm import' : 'Import Tokens'}
          </h2>
          <button
            aria-label="Close import tokens dialog"
            onClick={handleClose}
            disabled={isImporting}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* ===== STEP 1: SELECT ===== */}
          {step === 'select' && (
            <>
              {/* Warning - only show when there are tokens */}
              {discoveredTokenUids.length > 0 && (
                <div className="bg-green-600/20 border border-green-600/40 rounded-lg px-4 py-3">
                  <p className="text-sm font-bold text-green-400">Check before importing tokens</p>
                  <p className="text-xs text-green-400/80 mt-1">
                    Adding tokens is your responsibility. Make sure you recognize the source.
                  </p>
                </div>
              )}

              {/* Empty state */}
              {discoveredTokenUids.length === 0 && (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm font-bold text-white">No tokens available to import</p>
                  <p className="text-xs text-muted-foreground">
                    We didn't find any unregistered tokens linked to your wallet.
                    <br />
                    You can register a new one manually.
                  </p>
                  <button
                    onClick={() => { handleClose(); navigate('/register-token'); }}
                    className="px-6 py-2.5 bg-[#0D1117] border border-border hover:bg-[#161B22] text-white rounded-lg transition-colors font-medium"
                  >
                    Register a token
                  </button>
                </div>
              )}

              {/* Token list */}
              {discoveredTokenUids.length > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select the tokens you want to add to your wallet.
                  </p>

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Tokens found ({discoveredTokenUids.length})
                    </h3>
                    {discoveredTokenUids.length > 1 && (
                      <button
                        onClick={selectAll}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {isAllSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    )}
                  </div>

                  <div
                    ref={scrollContainerRef}
                    className="max-h-[300px] overflow-y-auto space-y-2 -mx-2 px-2"
                  >
                    {discoveredTokenUids.map((uid) => {
                      const detail = tokenDetails.get(uid);
                      const isLoaded = !!detail?.name;

                      return isLoaded ? (
                        <label key={uid} data-token-uid={uid} className="cursor-pointer block">
                          <TokenRow token={detail!} showCheckbox />
                        </label>
                      ) : (
                        <div
                          key={uid}
                          data-token-uid={uid}
                          className="flex items-center gap-3 p-3 bg-[#0D1117] border border-border rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTokens.has(uid)}
                            onChange={() => toggleToken(uid)}
                            className="w-4 h-4 rounded border-border bg-[#0D1117] text-primary accent-primary flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading...
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {truncateString(uid, 8, 8)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-muted-foreground font-mono">
                              {truncateString(uid, 5, 5)}
                            </span>
                            <a
                              href={`${explorerBaseUrl}/token_detail/${uid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View token on explorer"
                              className="p-0.5 hover:text-primary-400 text-muted-foreground transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleContinue}
                    disabled={selectedTokens.size === 0}
                    className="w-full px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    Continue
                  </button>
                </>
              )}
            </>
          )}

          {/* ===== STEP 2: CONFIRM ===== */}
          {step === 'confirm' && (
            <>
              <p className="text-sm text-muted-foreground">
                You are about to add these tokens to your wallet:
              </p>

              <div className="max-h-[300px] overflow-y-auto space-y-2 -mx-2 px-2">
                {selectedTokenList.map((token) => (
                  <TokenRow key={token.uid} token={token} />
                ))}
              </div>

              {/* Error */}
              {importError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-400 text-sm">{importError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('select'); setImportError(null); }}
                  disabled={isImporting}
                  className="flex-1 px-4 py-2.5 bg-[#0D1117] border border-border hover:bg-[#161B22] text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import tokens'
                  )}
                </button>
              </div>
            </>
          )}

          {/* ===== STEP 3: SUCCESS ===== */}
          {step === 'success' && (
            <>
              <div className="flex items-center gap-2 py-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-white">Tokens imported!</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-[#0D1117] border border-border hover:bg-[#161B22] text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => { handleClose(); navigate('/?filter=tokens'); }}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                >
                  See all tokens
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportTokensDialog;
