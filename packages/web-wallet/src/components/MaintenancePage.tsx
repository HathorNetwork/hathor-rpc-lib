import React, { useState } from 'react';
import { Wrench, Copy, Check } from 'lucide-react';
import htrLogoBlack from '../assets/htr_logo_black.svg';

interface MaintenancePageProps {
  browserId: string;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ browserId }) => {
  const [copied, setCopied] = useState(false);
  const [showBrowserId, setShowBrowserId] = useState(false);

  const handleCopyBrowserId = async () => {
    try {
      await navigator.clipboard.writeText(browserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy browser ID:', error);
    }
  };

  return (
    <div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>
      <div className='text-center space-y-6 max-w-md px-6'>
        <div className='w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto p-4 shadow-xl'>
          <img
            src={htrLogoBlack}
            alt='Hathor'
            className='w-full h-full object-contain'
          />
        </div>
        <div className='space-y-4'>
          <div className='flex flex-col items-center justify-center gap-2'>
            <Wrench className='w-8 h-8 text-primary' />
            <h1 className='text-2xl font-medium'>Under Maintenance</h1>
          </div>
          <p className='text-muted-foreground'>
            The Hathor Web Wallet is currently undergoing maintenance. Please check back later.
          </p>
          <p className='text-sm text-muted-foreground'>
            In the meantime, you can use the{' '}
            <a
              href='https://hathor.network/htr'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline'
            >
              Hathor Desktop or Mobile Wallets
            </a>
            .
          </p>
        </div>

        {/* Browser ID */}
        <div className='pt-4 border-t border-[#24292F]'>
          {!showBrowserId ? (
            <button
              onClick={() => setShowBrowserId(true)}
              className='text-xs text-muted-foreground hover:text-primary transition-colors'
            >
              Need help?
            </button>
          ) : (
            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground'>
                Share your Browser ID with the team:
              </p>
              <button
                onClick={handleCopyBrowserId}
                className='inline-flex items-center gap-2 px-3 py-1.5 bg-[#191C21] border border-[#24292F] rounded-lg text-xs font-mono text-muted-foreground hover:border-primary/50 transition-colors'
              >
                <span className='truncate max-w-[200px]'>{browserId}</span>
                {copied ? (
                  <Check className='w-3.5 h-3.5 text-green-500 flex-shrink-0' />
                ) : (
                  <Copy className='w-3.5 h-3.5 flex-shrink-0' />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
