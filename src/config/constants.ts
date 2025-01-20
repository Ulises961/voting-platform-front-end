export const NETWORK_ID = 31337
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`
export const PINATA_GATEWAY = 'https://coffee-electoral-dinosaur-159.mypinata.cloud'
export const PINATA_JWT ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwZTUyNWJiZC04MGMwLTQyMzMtOWYwOC0xYWRmZmVmN2VmMDQiLCJlbWFpbCI6InBpbmF0YS5tYXJjaDEyMUBwYXNzaW5ib3guY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImY4YzI0MjNiMmEwOTU2OGE3YTE0Iiwic2NvcGVkS2V5U2VjcmV0IjoiMDdiYTEyZDAwOTY2NjMwOWM1MTVkZDRkOWE2Y2VjNTRlZmUwZWI1NWEwNWQ2NzA3MzMwZjExZWIwMjE0Y2VmZCIsImV4cCI6MTc2ODg5ODAwMX0.WPwGtL3fmZ1F_9UbZN1adHkFYKr0weSYmmXSu4GRCyg'

// Chain configurations
export const CHAINS = {
  LOCALHOST: 31337,
  SEPOLIA: 11155111
} as const

// Contract configuration
export const CONTRACT_CONFIG = {
  address: CONTRACT_ADDRESS,
  chainId: NETWORK_ID
} as const

// IPFS configuration
export const IPFS_CONFIG = {
  gateway: PINATA_GATEWAY,
  jwt: PINATA_JWT
} as const


export const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
export const PROPOSALS_PER_PAGE = 10