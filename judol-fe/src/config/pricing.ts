/**
 * Centralized pricing configuration for the JUDOL platform
 * Single source of truth for all pricing-related values
 */

export const PRICING = {
  // Price values
  VERIFIED_PAPER_PRICE: "50 USDC",
  DATASET_PRICE: "100 USDC",
  VERIFICATION_REWARD: "50 USDC",
  MINTING_FEE: "10 USDC",

  // Currency symbol
  CURRENCY_SYMBOL: "USDC",

  // Formatting functions
  formatPrice: (amount: number, currency: string = PRICING.CURRENCY_SYMBOL): string => {
    return `${amount} ${currency}`;
  },

  // Get price functions
  getVerifiedPrice: (): string => PRICING.VERIFIED_PAPER_PRICE,
  getDatasetPrice: (): string => PRICING.DATASET_PRICE,
  getVerificationReward: (): string => PRICING.VERIFICATION_REWARD,
  getMintingFee: (): string => PRICING.MINTING_FEE,

  // Numeric values (for calculations)
  VERIFIED_PAPER_PRICE_NUMERIC: 50, // in USDC (6 decimals)
  VERIFICATION_REWARD_NUMERIC: 50, // in USDC (6 decimals)
  MINTING_FEE_NUMERIC: 10, // in USDC (6 decimals)

  // Helper to convert to wei (6 decimals for USDC)
  toWei: (usdcAmount: number): bigint => {
    return BigInt(Math.floor(usdcAmount * 1e6));
  },

  // Helper to convert from wei (6 decimals for USDC)
  fromWei: (wei: bigint): number => {
    return Number(wei) / 1e6;
  },
};

export default PRICING;
