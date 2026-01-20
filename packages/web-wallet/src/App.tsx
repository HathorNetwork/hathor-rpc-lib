import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { MetaMaskProvider } from '@hathor/snap-utils'
import { WalletProvider } from './contexts/WalletContext'
import { FeatureToggleProvider, useFeatureToggle } from './contexts/FeatureToggleContext'
import WalletHome from './components/WalletHome'
import MaintenancePage from './components/MaintenancePage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from './components/ui/toaster'
import SendDialog from './components/SendDialog'
import ReceiveDialog from './components/ReceiveDialog'
import HistoryDialog from './components/HistoryDialog'
import RegisterTokenDialog from './components/RegisterTokenDialog'
import CreateTokenDialog from './components/CreateTokenDialog'
import { Loader2 } from 'lucide-react'
import htrLogoBlack from './assets/htr_logo_black.svg'
import AddressModeDialog from './components/AddressModeDialog'

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

function AddressModeDialogRoute() {
  const navigate = useNavigate()
  return <AddressModeDialog isOpen={true} onClose={() => navigate('/')} />
}

// Component that gates the wallet based on feature toggle
function FeatureGatedWallet() {
  const { isUnderMaintenance, isLoading, browserId } = useFeatureToggle()

  // Show loading screen while checking feature toggle
  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>
        <div className='text-center space-y-6'>
          <div className='w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto p-4 shadow-xl'>
            <img
              src={htrLogoBlack}
              alt='Hathor'
              className='w-full h-full object-contain'
            />
          </div>
          <div>
            <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4' />
            <p className='text-muted-foreground'>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show maintenance page if maintenance toggle is enabled
  if (isUnderMaintenance) {
    return <MaintenancePage browserId={browserId} />
  }

  // Show normal wallet UI
  return (
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
            <Route path="address-mode" element={<AddressModeDialogRoute />} />
          </Route>
        </Routes>
        <Toaster />
      </WalletProvider>
    </MetaMaskProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <FeatureToggleProvider>
          <FeatureGatedWallet />
        </FeatureToggleProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
