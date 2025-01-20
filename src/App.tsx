import { VotingPlatform } from './components/VotingPlatform';
import { CONTRACT_ADDRESS } from './config/constants';
import { CONTRACT_ABI } from './contracts/votingPlatform';

export default function App() {
  return (
    <VotingPlatform
      contractAddress={CONTRACT_ADDRESS}
      contractABI={CONTRACT_ABI}
    />
  );
}