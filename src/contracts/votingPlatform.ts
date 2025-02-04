// Types for frontend use
export interface Proposal {
  ipfsHash: string;
  title: string;
  votedYes: bigint;
  votedNo: bigint;
  endTime: bigint;
  executed: boolean;
  domain: string;
}

export interface Voter {
  votingPower: bigint;
  emailDomain: string;
}

// Simplified ABI with only needed functions
export const CONTRACT_ABI = [
  // Admin Management
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address"
      }
    ],
    name: "isAdmin",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isOwner",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    inputs: [{ internalType: "address", name: "_account", type: "address" }],
    name: "admins",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_newAdmin", type: "address" }],
    name: "proposeNewAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_proposedAdmin", type: "address" }],
    name: "approveNewAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_headerJson",
        type: "string"
      },
      {
        internalType: "string",
        name: "_payloadJson",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_signature",
        type: "bytes"
      }
    ],
    name: "login",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    "inputs": [],
    "name": "withdrawFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Domain Management
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_domain",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_powerLevel",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_parentDomain",
        "type": "string"
      }
    ],
    "name": "addDomain",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_domain",
        "type": "string"
      }
    ],
    "name": "renewDomain",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_userDomain",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_targetDomain",
        "type": "string"
      }
    ],
    "name": "canAccessDomain",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDomains",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Proposal Management
  {
    inputs: [
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "address", name: "_voterAddress", type: "address" },
      { internalType: "bool", name: "_restrictToDomain", type: "bool" }
    ],
    name: "createProposal",
    outputs: [{ internalType: "string", name: "_ipfsHash", type: "string" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getAllProposals",
    outputs: [{
      components: [
        { internalType: "string", name: "ipfsHash", type: "string" },
        { internalType: "uint256", name: "votedYes", type: "uint256" },
        { internalType: "uint256", name: "votedNo", type: "uint256" },
        { internalType: "uint256", name: "endTime", type: "uint256" },
        { internalType: "string", name: "domain", type: "string" },
        { internalType: "bool", name: "restrictDomain", type: "bool" }  
      ],
      internalType: "struct VotingPlatform.Proposal[]",
      name: "",
      type: "tuple[]"
    }],
    stateMutability: "view",
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
  },

  // Voter Management
  {
    inputs: [
      { internalType: "string", name: "_headerJson", type: "string" },
      { internalType: "string", name: "_payload", type: "string" },
      { internalType: "bytes", name: "_signature", type: "bytes" },
    ],
    name: "registerWithDomain",
    outputs: [
      {internalType: "string", name: "domain", type: "string"}
    ],
    stateMutability: "nonpayable",
    type: "function"
  },

  // JWT validator
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "kid",
            "type": "string"
          },
          {
            "internalType": "bytes",
            "name": "modulus",
            "type": "bytes"
          }
        ],
        "internalType": "struct JWTValidator.GoogleModule[]",
        "name": "googleModule",
        "type": "tuple[]"
      }
    ],
    "name": "addModulus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    inputs: [],
    name: "getAllModuli",
    outputs: [
      { internalType: "bytes[]", name: "", type: "bytes[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "kid", type: "string" }
    ],
    name: "getModulus",
    outputs: [
      { internalType: "bytes", name: "", type: "bytes" }
    ],
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
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "ipfsHash", type: "string" },
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: false, internalType: "bool", name: "support", type: "bool" }
    ],
    name: "VoteCast",
    type: "event"
  }
] as const;

// Export contract config
export const VOTING_PLATFORM = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
} as const