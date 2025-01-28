import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CONTRACT_ADDRESS } from './config/constants'
import { CONTRACT_ABI } from './contracts/votingPlatform'
import { config } from './config/wagmi'
import Home from './components/Home'
import { VotingProvider } from './context/VotingContext'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <VotingProvider>
          <Home
            contractAddress={CONTRACT_ADDRESS}
            contractABI={CONTRACT_ABI}
          />
        </VotingProvider>

      </QueryClientProvider>
    </WagmiProvider>
  )
}