// Chain configurations
export const CHAINS = {
  LOCALHOST: process.env.NEXT_PUBLIC_NETWORK_ID,
  SEPOLIA: 11155111
} as const

// Contract configuration
export const CONTRACT_CONFIG = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  chainId: process.env.NEXT_PUBLIC_NETWORK_ID
} as const

