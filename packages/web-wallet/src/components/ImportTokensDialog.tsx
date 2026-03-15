import React, { useState, useCallback } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Upload, FileText } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { tokenRegistryService } from '../services/TokenRegistryService';
import { truncateString } from '../utils/hathor';

interface ImportTokensDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenLine {
  line: number;
  configString: string;
  name?: string;
  symbol?: string;
  uid?: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  line: number;
  configString: string;
  name?: string;
  symbol?: string;
  success: boolean;
  error?: string;
}

type ImportPhase = 'input' | 'preview' | 'importing' | 'done';

const ImportTokensDialog: React.FC<ImportTokensDialogProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<ImportPhase>('input');
  const [rawInput, setRawInput] = useState('');
  const [parsedTokens, setParsedTokens] = useState<TokenLine[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const { registerToken } = useWallet();

  const parseInput = useCallback((text: string): TokenLine[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.map((configString, index) => {
      const validation = tokenRegistryService.validateConfigString(configString);
      if (validation.valid && validation.parsed) {
        return {
          line: index + 1,
          configString,
          name: validation.parsed.name,
          symbol: validation.parsed.symbol,
          uid: validation.parsed.uid,
          valid: true,
        };
      }
      return {
        line: index + 1,
        configString,
        valid: false,
        error: 'Invalid configuration string format or checksum',
      };
    });
  }, []);

  const handlePreview = () => {
    const tokens = parseInput(rawInput);
    setParsedTokens(tokens);
    setPhase('preview');
  };

  const handleImport = async () => {
    const validTokens = parsedTokens.filter(t => t.valid);
    if (validTokens.length === 0) return;

    setPhase('importing');
    setImportProgress(0);
    const importResults: ImportResult[] = [];

    for (let i = 0; i < validTokens.length; i++) {
      const token = validTokens[i];
      try {
        await registerToken(token.configString);
        importResults.push({
          line: token.line,
          configString: token.configString,
          name: token.name,
          symbol: token.symbol,
          success: true,
        });
      } catch (err) {
        importResults.push({
          line: token.line,
          configString: token.configString,
          name: token.name,
          symbol: token.symbol,
          success: false,
          error: err instanceof Error ? err.message : 'Failed to register token',
        });
      }
      setImportProgress(i + 1);
      setResults([...importResults]);
    }

    // Also add invalid tokens to results for completeness
    for (const token of parsedTokens.filter(t => !t.valid)) {
      importResults.push({
        line: token.line,
        configString: token.configString,
        success: false,
        error: token.error,
      });
    }

    setResults(importResults.sort((a, b) => a.line - b.line));
    setPhase('done');
  };

  const handleClose = () => {
    if (phase === 'importing') return; // Don't close while importing
    setPhase('input');
    setRawInput('');
    setParsedTokens([]);
    setResults([]);
    setImportProgress(0);
    onClose();
  };

  const handleBack = () => {
    if (phase === 'preview') {
      setPhase('input');
      setParsedTokens([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawInput(text.trim());
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  if (!isOpen) return null;

  const validCount = parsedTokens.filter(t => t.valid).length;
  const invalidCount = parsedTokens.filter(t => !t.valid).length;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0"
      onClick={(e) => { if (e.target === e.currentTarget && phase !== 'importing') handleClose(); }}
    >
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-lg my-4 md:my-0 md:mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-[#24292F]">
          <h2 className="text-base font-bold text-primary-400">Import Tokens</h2>
          <button
            onClick={handleClose}
            disabled={phase === 'importing'}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Phase: Input */}
          {phase === 'input' && (
            <>
              <div>
                <label className="block text-base font-bold text-white mb-2">
                  Token Configuration Strings
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Paste one configuration string per line. Format: [name:symbol:uid:checksum]
                </p>
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={`[TokenA:TKA:00001bc7043d0aa910e28aff4b2aad8b4de76c709da4d16a48bf713067245029:checksum]\n[TokenB:TKB:00002bc7043d0aa910e28aff4b2aad8b4de76c709da4d16a48bf713067245029:checksum]`}
                  rows={6}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-border rounded-lg text-white placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                />
              </div>

              {/* File upload */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-[#0D1117] border border-border rounded-lg cursor-pointer hover:bg-[#24292F] transition-colors">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Load from file</span>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {rawInput && (
                  <span className="text-xs text-muted-foreground">
                    {rawInput.split('\n').filter(l => l.trim().length > 0).length} line(s)
                  </span>
                )}
              </div>

              <button
                onClick={handlePreview}
                disabled={!rawInput.trim()}
                className="w-full px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Preview Import
              </button>
            </>
          )}

          {/* Phase: Preview */}
          {phase === 'preview' && (
            <>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-white">
                    {validCount} valid token{validCount !== 1 ? 's' : ''} found
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-sm text-red-400">
                      ({invalidCount} invalid)
                    </span>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {parsedTokens.map((token) => (
                    <div
                      key={token.line}
                      className={`p-3 rounded-lg border ${
                        token.valid
                          ? 'bg-[#0D1117] border-border'
                          : 'bg-red-500/5 border-red-500/30'
                      }`}
                    >
                      {token.valid ? (
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {token.name} ({token.symbol})
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {truncateString(token.uid!, 8, 8)}
                            </p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-red-400">{token.error}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate mt-1">
                              Line {token.line}: {truncateString(token.configString, 20, 10)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2.5 bg-[#0D1117] border border-border hover:bg-[#24292F] text-white rounded-lg transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Import {validCount} token{validCount !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}

          {/* Phase: Importing */}
          {phase === 'importing' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <div>
                <p className="text-sm text-white">
                  Importing tokens... {importProgress} / {parsedTokens.filter(t => t.valid).length}
                </p>
                <div className="w-full bg-[#0D1117] rounded-full h-2 mt-3">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress / parsedTokens.filter(t => t.valid).length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Live results */}
              {results.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 mt-4">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {r.success ? (
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span className={r.success ? 'text-green-400' : 'text-red-400'}>
                        {r.name || truncateString(r.configString, 15, 10)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Phase: Done */}
          {phase === 'done' && (
            <>
              <div className="text-center space-y-2">
                {failCount === 0 ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
                    <p className="text-sm text-green-400 font-medium">
                      All {successCount} token{successCount !== 1 ? 's' : ''} imported successfully!
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto" />
                    <p className="text-sm text-white font-medium">
                      {successCount} imported, {failCount} failed
                    </p>
                  </>
                )}
              </div>

              {/* Results list */}
              <div className="max-h-52 overflow-y-auto space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      r.success
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {r.success ? (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-white truncate">
                        {r.name ? `${r.name} (${r.symbol})` : truncateString(r.configString, 20, 10)}
                      </span>
                    </div>
                    {r.error && (
                      <p className="text-xs text-red-400 mt-1 ml-6">{r.error}</p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleClose}
                className="w-full px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportTokensDialog;
