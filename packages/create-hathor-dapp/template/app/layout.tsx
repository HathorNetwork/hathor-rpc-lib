import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hathor Dice - Provably Fair Dice Game',
  description: 'A provably fair dice game built on Hathor Network using nano contracts',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-8">
                    <Link href="/" className="text-2xl font-bold text-hathor-primary">
                      🎲 Hathor Dice
                    </Link>
                    <div className="hidden md:flex space-x-6">
                      <Link
                        href="/"
                        className="text-gray-700 hover:text-hathor-primary transition-colors"
                      >
                        Play
                      </Link>
                      <Link
                        href="/liquidity"
                        className="text-gray-700 hover:text-hathor-primary transition-colors"
                      >
                        Liquidity Pool
                      </Link>
                      <Link
                        href="/how-it-works"
                        className="text-gray-700 hover:text-hathor-primary transition-colors"
                      >
                        How It Works
                      </Link>
                    </div>
                  </div>
                  <div id="wallet-button-container">
                    {/* Wallet button will be rendered here by components */}
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="mt-16 py-8 bg-white border-t border-gray-200">
              <div className="container mx-auto px-4 text-center text-gray-600">
                <p>
                  Built with ❤️ on{' '}
                  <a
                    href="https://hathor.network"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-hathor-primary hover:underline"
                  >
                    Hathor Network
                  </a>
                </p>
                <p className="text-sm mt-2">
                  Provably fair gaming powered by nano contracts
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
