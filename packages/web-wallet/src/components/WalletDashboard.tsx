import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';

const WalletDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-16">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Hathor Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7">
                <svg viewBox="0 0 111 28" className="w-full h-full fill-white">
                  <path d="M0 27.64V27.29C0 27.13 0.11 27.02 0.27 27.02H3.22C3.38 27.02 3.49 26.91 3.49 26.75V24.36C3.49 24.2 3.6 24.09 3.76 24.09H6.71C6.87 24.09 6.98 23.98 6.98 23.82V21.43C6.98 21.27 7.09 21.16 7.25 21.16H10.2C10.36 21.16 10.47 21.05 10.47 20.89V18.5C10.47 18.34 10.58 18.23 10.74 18.23H13.69C13.85 18.23 13.96 18.12 13.96 17.96V15.57C13.96 15.41 14.07 15.3 14.23 15.3H17.18C17.34 15.3 17.45 15.19 17.45 15.03V12.64C17.45 12.48 17.56 12.37 17.72 12.37H20.67C20.83 12.37 20.94 12.26 20.94 12.1V9.71C20.94 9.55 21.05 9.44 21.21 9.44H24.16C24.32 9.44 24.43 9.33 24.43 9.17V6.78C24.43 6.62 24.54 6.51 24.7 6.51H27.65C27.81 6.51 27.92 6.4 27.92 6.24V3.85C27.92 3.69 28.03 3.58 28.19 3.58H31.14C31.3 3.58 31.41 3.47 31.41 3.31V0.92C31.41 0.76 31.52 0.65 31.68 0.65H34.63C34.79 0.65 34.9 0.76 34.9 0.92V3.31C34.9 3.47 35.01 3.58 35.17 3.58H38.12C38.28 3.58 38.39 3.69 38.39 3.85V6.24C38.39 6.4 38.5 6.51 38.66 6.51H41.61C41.77 6.51 41.88 6.62 41.88 6.78V9.17C41.88 9.33 41.99 9.44 42.15 9.44H45.1C45.26 9.44 45.37 9.55 45.37 9.71V12.1C45.37 12.26 45.48 12.37 45.64 12.37H48.59C48.75 12.37 48.86 12.48 48.86 12.64V15.03C48.86 15.19 48.97 15.3 49.13 15.3H52.08C52.24 15.3 52.35 15.41 52.35 15.57V17.96C52.35 18.12 52.46 18.23 52.62 18.23H55.57C55.73 18.23 55.84 18.34 55.84 18.5V20.89C55.84 21.05 55.95 21.16 56.11 21.16H59.06C59.22 21.16 59.33 21.27 59.33 21.43V23.82C59.33 23.98 59.44 24.09 59.6 24.09H62.55C62.71 24.09 62.82 24.2 62.82 24.36V26.75C62.82 26.91 62.93 27.02 63.09 27.02H66.04C66.2 27.02 66.31 27.13 66.31 27.29V27.64" />
                </svg>
              </div>
              <div className="bg-primary/20 border border-white/20 rounded-full px-2 py-1">
                <span className="text-xs font-medium text-white">WEB WALLET</span>
              </div>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-secondary border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded-full"></div>
            <span className="text-sm text-white font-mono">937ihkw...dfjx472</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </div>
        </header>

        {/* Assets Summary Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">assets summary</p>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z"/>
                  </svg>
                </div>
                <span className="text-2xl font-medium text-white">30,000 HTR</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="bg-secondary hover:bg-secondary/80 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
                <span>Send</span>
              </button>
              <button className="bg-secondary hover:bg-secondary/80 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-colors">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Receive</span>
              </button>
            </div>
          </div>
        </div>

        {/* My Assets Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-white">My Assets</h2>
            <button className="bg-transparent hover:bg-secondary/20 text-primary px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span>View full history</span>
            </button>
          </div>

          {/* Assets List */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <div className="text-lg font-medium text-white">HTR</div>
                  <div className="text-sm text-muted-foreground">Hathor</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium text-white">30,000.00</span>
                <button className="bg-transparent border border-border hover:bg-secondary/20 text-white px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors">
                  <span>Send</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="border-t border-border"></div>
            <div className="p-4 flex items-center gap-2 bg-secondary/30">
              <div className="w-6 h-6 text-yellow-500">⚠️</div>
              <span className="text-sm text-muted-foreground">
                HTR is the only supported token in this version. Support for custom tokens is coming soon.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;