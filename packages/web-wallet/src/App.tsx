import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { MetaMaskProvider } from '@hathor/snap-utils'
import { WalletProvider } from './contexts/WalletContext'
import WalletHome from './components/WalletHome'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from './components/ui/toaster'
import SendDialog from './components/SendDialog'
import ReceiveDialog from './components/ReceiveDialog'
import HistoryDialog from './components/HistoryDialog'
import RegisterTokenDialog from './components/RegisterTokenDialog'
import CreateTokenDialog from './components/CreateTokenDialog'
// TODO: Re-enable when address mode switching logic is finalized
// import AddressModeDialog from './components/AddressModeDialog'

// Route wrappers that connect URL params to dialog props
function SendDialogRoute() {
  const navigate = useNavigate()
  const { tokenUid } = useParams()
  return <SendDialog isOpen={true} onClose={() => navigate('/')} initialTokenUid={tokenUid} />
}

function ReceiveDialogRoute() {
  const navigate = useNavigate()
  return <ReceiveDialog isOpen={true} onClose={() => navigate('/')} />
}

function HistoryDialogRoute() {
  const navigate = useNavigate()
  const { tokenUid } = useParams()
  return (
    <HistoryDialog
      isOpen={true}
      onClose={() => navigate('/')}
      tokenUid={tokenUid}
      onRegisterTokenClick={() => navigate('/register-token')}
    />
  )
}

function RegisterTokenDialogRoute() {
  const navigate = useNavigate()
  return <RegisterTokenDialog isOpen={true} onClose={() => navigate('/')} />
}

function CreateTokenDialogRoute() {
  const navigate = useNavigate()
  return <CreateTokenDialog isOpen={true} onClose={() => navigate('/')} />
}

// TODO: Re-enable when address mode switching logic is finalized
// function AddressModeDialogRoute() {
//   const navigate = useNavigate()
//   return <AddressModeDialog isOpen={true} onClose={() => navigate('/')} />
// }

function App() { return (
    <ErrorBoundary>
      <BrowserRouter>
        <MetaMaskProvider>
          <WalletProvider>
            <Routes>
              <Route path="/" element={<WalletHome />}>
                <Route path="send" element={<SendDialogRoute />} />
                <Route path="send/:tokenUid" element={<SendDialogRoute />} />
                <Route path="receive" element={<ReceiveDialogRoute />} />
                <Route path="history/:tokenUid" element={<HistoryDialogRoute />} />
                <Route path="register-token" element={<RegisterTokenDialogRoute />} />
                <Route path="create-token" element={<CreateTokenDialogRoute />} />
                {/* TODO: Re-enable when address mode switching logic is finalized */}
                {/* <Route path="address-mode" element={<AddressModeDialogRoute />} /> */}
              </Route>
            </Routes>
            <Toaster />
          </WalletProvider>
        </MetaMaskProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
