import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import Home from './components/Home'
import { VotingProvider } from './context/VotingContext'
import { CONTRACT_ABI } from './contracts/votingPlatform'
import { CONTRACT_CONFIG } from './config/constants'

const queryClient = new QueryClient()

export default function App() {  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <VotingProvider>
          <Home
            contractAddress={CONTRACT_CONFIG.address}
            contractABI={CONTRACT_ABI}
          />
          
        </VotingProvider>

      </QueryClientProvider>
    </WagmiProvider>
  )
}