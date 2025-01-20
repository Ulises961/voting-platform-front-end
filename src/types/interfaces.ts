// Add type safety
export interface ProposalResponse {
  title: string;
  description: string;
  voteCount: bigint;
  startTime: bigint;
  endTime: bigint;
  executed: boolean;
}

export interface CachedProposal {
  ipfsHash: string
  title: string
  votedYes: number
  votedNo: number
  endTime: number
  executed: boolean
  lastUpdated: number
}

interface BlockRange {
  fromBlock: bigint
  toBlock: bigint
}
