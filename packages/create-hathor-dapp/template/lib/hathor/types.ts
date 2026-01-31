/**
 * Types for Hathor dApp interactions
 */

export interface WalletInfo {
  address: string;
  network: string;
  xpub?: string;
}

export interface TokenBalance {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  balance: number;
  locked: number;
}

export interface ContractBalance {
  balance: number;
  tokenUid: string;
}

export interface PlaceBetParams {
  betAmount: number;
  threshold: number;
}

export interface PlaceBetResult {
  randomNumber: number;
  payout: number;
  won: boolean;
  txId?: string;
}

export interface AddLiquidityParams {
  amount: number;
}

export interface AddLiquidityResult {
  adjustedAmount: number;
  txId?: string;
}

export interface RemoveLiquidityParams {
  amount: number;
}

export interface RemoveLiquidityResult {
  withdrawnAmount: number;
  txId?: string;
}

export interface LiquidityPosition {
  amount: number;
  share: number; // Percentage of total pool
  estimatedValue: number;
}

export interface ContractStats {
  totalLiquidity: number;
  houseEdge: number;
  maxBet: number;
  totalBets: number;
  totalVolume: number;
}

export interface NanoContractAction {
  type: 'deposit' | 'withdrawal';
  token_uid: string;
  amount: number;
}

export interface SendNanoContractTxParams {
  ncId: string;
  method: string;
  args: any[];
  actions: NanoContractAction[];
}

export interface HathorError {
  message: string;
  code?: string;
  data?: any;
}
