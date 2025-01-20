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
   // Constructor
   {
    inputs: [{ internalType: "uint256", name: "_votingPeriod", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "approver", type: "address" },
      { indexed: true, internalType: "address", name: "newAdmin", type: "address" }
    ],
    name: "AdminApproved",
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
  },
  
  // Read functions
  {
    inputs: [{ internalType: "address", name: "_account", type: "address" }],
    name: "isAdmin",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "proposals",
    outputs: [
      { internalType: "string", name: "ipfsHash", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "votedYes", type: "uint256" },
      { internalType: "uint256", name: "votedNo", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "bool", name: "executed", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    "inputs": [],
    "name": "getAllProposals",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "ipfsHash", "type": "string" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "uint256", "name": "votedYes", "type": "uint256" },
          { "internalType": "uint256", "name": "votedNo", "type": "uint256" },
          { "internalType": "uint256", "name": "endTime", "type": "uint256" },
          { "internalType": "bool", "name": "executed", "type": "bool" }
        ],
        "internalType": "struct Proposal[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
  {
    inputs: [
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "_startTime", type: "uint256" }
    ],
    name: "createProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_voter", type: "address" }],
    name: "registerVoter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "bool", name: "_support", type: "bool" }
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// Export contract config
export const VOTING_PLATFORM = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
} as const