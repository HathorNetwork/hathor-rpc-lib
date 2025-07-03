import { create } from 'zustand'
import { Token } from '../types/wallet'

interface WalletStore {
  address: string
  totalBalance: number
  tokens: Token[]
  isLoading: boolean
  setAddress: (address: string) => void
  setTokens: (tokens: Token[]) => void
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: 'HGN8HPyrq9qEjsWNrrZwTStEdf1WCxbnbE',
  totalBalance: 30000,
  tokens: [
    {
      id: 'htr',
      symbol: 'HTR',
      name: 'Hathor',
      balance: 30000,
      price: 0.5,
      priceChange24h: 0,
    },
    {
      id: 'cst',
      symbol: 'CST',
      name: 'Custom Token',
      balance: 0,
      price: 1.2,
      priceChange24h: 0,
    },
    {
      id: 'flo',
      symbol: 'FLO',
      name: 'FloraToken',
      balance: 254.90,
      price: 0.8,
      priceChange24h: 0,
    },
  ],
  isLoading: false,
  setAddress: (address) => set({ address }),
  setTokens: (tokens) => set({ tokens }),
}))