import { BrowserRouter } from 'react-router-dom'
import { MetaMaskProvider } from '@hathor/snap-utils'
import { WalletProvider } from './contexts/WalletContext'
import WalletHome from './components/WalletHome'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MetaMaskProvider>
          <ErrorBoundary>
            <WalletProvider>
              <ErrorBoundary>
                <WalletHome />
              </ErrorBoundary>
            </WalletProvider>
          </ErrorBoundary>
        </MetaMaskProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
