import { BrowserRouter } from 'react-router-dom'
import { MetaMaskProvider } from '@hathor/snap-utils'
import { WalletProvider } from './contexts/WalletContext'
import WalletHome from './components/WalletHome'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from './components/ui/toaster'

function App() { return (
    <ErrorBoundary>
      <BrowserRouter>
        <MetaMaskProvider>
          <WalletProvider>
            <WalletHome />
            <Toaster />
          </WalletProvider>
        </MetaMaskProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
