import { ethers } from "ethers";

// Add type safety
// export interface ProposalResponse {
//   title: string;
//   description: string;
//   voteCount: bigint;
//   startTime: bigint;
//   endTime: bigint;
//   executed: boolean;
// }

// export interface LoginFormProps {
//   onLogin: (email: string, isRegistering: boolean) => void;
//   checkRegistration: (domain: string) => Promise<boolean>;
// }

export interface GoogleModule {
  kid: string
  n: string
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

export interface Proposal {
  title: string;
  description: string;
  startTime: number;
  creator: string;
  timestamp: number;
  ipfsHash: string;
  votedYes: number;
  votedNo: number;
  endTime: number;
  restrictDomain: boolean;
}


// Interface for component props
export interface VotingPlatformProps {
  contractAddress: string;
  contractABI: any;
}

export interface VotingState {
  contract: ethers.Contract | null;
  account: string;
  jwt: string | null;
  isAdmin: boolean;
  votingPeriod: number;
  isRegistered: boolean;
  isLoggedIn: boolean;
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  domain: string;
}

export interface VotingContextType extends VotingState {
  dispatch: React.Dispatch<VotingAction>;
}


export type VotingAction =
  | { type: 'SET_CONTRACT'; payload: ethers.Contract }
  | { type: 'SET_ACCOUNT'; payload: string }
  | { type: 'SET_IS_ADMIN'; payload: boolean }
  | { type: 'SET_VOTING_PERIOD'; payload: number }
  | { type: 'SET_IS_REGISTERED'; payload: boolean }
  | { type: 'SET_PROPOSALS'; payload: Proposal[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_JWT'; payload: string | null }
  | { type: 'SET_IS_LOGGED_IN'; payload: boolean }
  | { type: 'LOGOUT';  payload: undefined }
  | { type: 'SET_DOMAIN'; payload: string }
  ;


export interface CreateProposalResponse {
    success: boolean;
    message: string;
    ipfsHash?: string;
}

export interface FetchProposalsResponse {
    proposals: Proposal[];
    success: boolean;
    message: string;
}

export interface ProposalParams {
    ipfsHash: string;
    creator: string;
    restrictDomain: boolean;
}