'use client'

import { useVoting } from '../../context/VotingContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Admin from '../../components/Admin'

export default function AdminPage() {
  const { isAdmin } = useVoting()
  const router = useRouter()

  useEffect(() => {
    if (!isAdmin) {
      router.push('/')
    }
  }, [isAdmin, router])

  return <Admin />
}