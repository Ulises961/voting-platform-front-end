import { ethers } from 'ethers'
import { PINATA_JWT } from '../config/constants'

interface ProposalMetadata {
  title: string
  description: string
  startTime: number
  creator: string
  timestamp: number
}

export const generateProposalHash = (metadata: ProposalMetadata): string => {
  const encodedData = ethers.solidityPacked(
    ['string', 'string', 'uint256', 'address', 'uint256'],
    [metadata.title, metadata.description, metadata.startTime, metadata.creator, metadata.timestamp]
  )
  return ethers.keccak256(encodedData)
}

export const pinProposalToIPFS = async (metadata: ProposalMetadata) => {
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`
    },
    body: JSON.stringify({
      pinataContent: {
        ...metadata
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to pin to IPFS: ${response.statusText}`)
  }

  const result = await response.json()
  return  result.IpfsHash
  
}