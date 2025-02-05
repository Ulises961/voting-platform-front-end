'use client'

import Home from '../components/Home'
import { CONTRACT_ABI } from '../contracts/votingPlatform'
import { CONTRACT_CONFIG } from '../config/constants'

export default function Page() {
  return (
    <Home 
      contractAddress={CONTRACT_CONFIG.address}
      contractABI={CONTRACT_ABI}
    />
  )
}