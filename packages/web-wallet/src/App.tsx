import { MetaMaskProvider } from '@hathor/snap-utils'
import { WalletProvider } from './contexts/WalletContext'
import WalletHome from './components/WalletHome'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <MetaMaskProvider>
        <ErrorBoundary>
          <WalletProvider>
            <ErrorBoundary>
              <WalletHome />
            </ErrorBoundary>
          </WalletProvider>
        </ErrorBoundary>
      </MetaMaskProvider>
    </ErrorBoundary>
  )
}

export default App
