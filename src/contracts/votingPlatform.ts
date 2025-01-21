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
  // Admin Management
  {
    inputs: [{ internalType: "address", name: "_account", type: "address" }],
    name: "admins",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_proposedAdmin", type: "address" }],
    name: "proposeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_proposedAdmin", type: "address" }],
    name: "approveAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  
  // Domain Management
  {
    inputs: [{ internalType: "string", name: "_domain", type: "string" }],
    name: "addDomain",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getDomains",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "approvedDomains",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Proposal Management
  {
    inputs: [
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "_startTime", type: "uint256" },
      { internalType: "string[]", name: "_allowedDomains", type: "string[]" }
    ],
    name: "createProposal",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getAllProposals",
    outputs: [{
      components: [
        { internalType: "string", name: "ipfsHash", type: "string" },
        { internalType: "string", name: "title", type: "string" },
        { internalType: "uint256", name: "votedYes", type: "uint256" },
        { internalType: "uint256", name: "votedNo", type: "uint256" },
        { internalType: "uint256", name: "endTime", type: "uint256" },
        { internalType: "bool", name: "executed", type: "bool" },
        { internalType: "string[]", name: "allowedDomains", type: "string[]" }
      ],
      internalType: "struct VotingPlatform.Proposal[]",
      name: "",
      type: "tuple[]"
    }],
    stateMutability: "view",
    type: "function"
  },
  
  // Voter Management
  {
    inputs: [{ internalType: "string", name: "_domain", type: "string" }],
    name: "registerWithDomain",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "_domain", type: "string" }],
    name: "isVoterRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "domain", type: "string" }
    ],
    name: "DomainAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "voter", type: "address" }
    ],
    name: "VoterRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "ipfsHash", type: "string" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "address", name: "proposer", type: "address" }
    ],
    name: "ProposalCreated",
    type: "event"
  }
] as const;

// Export contract config
export const VOTING_PLATFORM = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
} as const