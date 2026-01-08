import React from 'react';
import { Wrench } from 'lucide-react';
import htrLogoBlack from '../assets/htr_logo_black.svg';

const MaintenancePage: React.FC = () => {
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
      </div>
    </div>
  );
};

export default MaintenancePage;
