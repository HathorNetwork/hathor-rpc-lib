export interface Token {
  id: string
  symbol: string
  name: string
  balance: number
  price?: number
  priceChange24h?: number
}

export interface WalletState {
  address: string
  totalBalance: number
  tokens: Token[]
  isLoading: boolean
}