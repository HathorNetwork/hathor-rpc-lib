import { MetaMaskProvider } from '@hathor/snap-utils'
import { WalletProvider } from './contexts/WalletContext'
import WalletHome from './components/WalletHome'

function App() {
  return (
    <MetaMaskProvider>
      <WalletProvider>
        <WalletHome />
      </WalletProvider>
    </MetaMaskProvider>
  )
}

export default App
