import { CONTRACT_ADDRESS } from "../config/constants"

// Types for frontend use
export interface Proposal {
  id: number
  title: string
  description: string
  voteCount: bigint
  startTime: bigint
  endTime: bigint
  executed: boolean
  proposalHash: string
  ipfsHash: string
}

export interface Voter {
  isRegistered: boolean
  votingPower: bigint
  lastVoteTime: bigint
}

// Simplified ABI with only needed functions
export const CONTRACT_ABI = [
  // Read functions
  'function voters(address) view returns (bool isRegistered, uint256 votingPower, uint256 lastVoteTime)',
  'function proposals(uint256) view returns (string proposalHash, string ipfsHash, string title, uint256 voteCount, uint256 startTime, uint256 endTime, bool executed)',
  'function proposalCount() view returns (uint256)',
  'function isAdmin(address) view returns (bool)',
  
  // Write functions
  'function registerVoter(address _voter)',
  'function createProposal(string _ipfsHash, string _title, uint256 _startTime) returns (uint256)',
  'function castVote(string  _ipfsHash, bool _support)',
  
  // Events
  'event VoterRegistered(address indexed voter)',
  'event ProposalCreated(uint256 indexed proposalId, string title, address proposer)',
  'event VoteCast(uint256 indexed proposalId, address indexed voter, bool support)'
] as const

// Export contract config
export const VOTING_PLATFORM = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
} as const