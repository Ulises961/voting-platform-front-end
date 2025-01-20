import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VotingPlatform } from './components/VotingPlatform'
import { CONTRACT_ADDRESS } from './config/constants'
import { CONTRACT_ABI } from './contracts/votingPlatform'
import { config } from './config/wagmi'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <VotingPlatform
          contractAddress={CONTRACT_ADDRESS}
          contractABI={CONTRACT_ABI}
        />
      </QueryClientProvider>
    </WagmiProvider>
  )
}