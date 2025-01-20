// Add type safety
export interface ProposalResponse {
  title: string;
  description: string;
  voteCount: bigint;
  startTime: bigint;
  endTime: bigint;
  executed: boolean;
}

export interface CachedProposal extends Proposal {
  ipfsHash: string
  title: string
  votedYes: number
  votedNo: number
  endTime: number
  executed: boolean
}

export interface BlockRange {
  fromBlock: bigint
  toBlock: bigint
}

// Interface for Proposal structure
export interface Proposal {
  ipfsHash: string
  title: string
  votedYes: number
  votedNo: number
  endTime: number
  executed: boolean
}

// Interface for component props
export interface VotingPlatformProps {
  contractAddress: string;
  contractABI: any;
}