'use client'

import { useVoting } from '../../context/VotingContext'
import Listing from '../../components/Listing'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProposalsPage() {
  const { isLoggedIn } = useVoting()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/')
    }
  }, [isLoggedIn, router])

  return <Listing />
}