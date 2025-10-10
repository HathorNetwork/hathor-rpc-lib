import { MetaMaskProvider } from '@hathor/snap-utils'
import { WalletProvider } from './contexts/WalletContext'
import ProperWalletHome from './components/ProperWalletHome'

function App() {
  return (
    <MetaMaskProvider>
      <WalletProvider>
        <ProperWalletHome />
      </WalletProvider>
    </MetaMaskProvider>
  )
}

export default App
