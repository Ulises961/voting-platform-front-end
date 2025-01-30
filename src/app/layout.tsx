'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VotingProvider } from '../context/VotingContext'
import { config } from '../config/wagmi'
import App from '../App'

const queryClient = new QueryClient()


export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <VotingProvider>
                <App />
                {children}
              </VotingProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </body>
      </html>
    )
  }