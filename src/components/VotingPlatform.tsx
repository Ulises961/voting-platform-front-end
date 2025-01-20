// VotingPlatform.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { ErrorBoundary } from './ErrorBoundary';
import { pinProposalToIPFS } from '../utilities/ipfsUtils';
import { CACHE_DURATION, PROPOSALS_PER_PAGE } from '../config/constants';
import { CachedProposal, Proposal, VotingPlatformProps } from '../types/interfaces';
import { Log } from 'ethers';
import { useProposalBlocks } from '../utilities/proposalsCache';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';



export const VotingPlatform: React.FC<VotingPlatformProps> = ({ contractAddress, contractABI }) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [publicClient] = useState(createPublicClient({
    chain: hardhat,
    transport: http()
  }));


  // Form states
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    startTime: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  });

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const votingContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        setAccount(accounts[0]);
        setContract(votingContract);
      } else {
        setError('Please install MetaMask');
      }
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    }
  };

  const fetchProposals = async () => {
    if (!contract) return;
  
    try {
      setLoading(true);
      
      const proposalsArray = await contract.getAllProposals();
      const formattedProposals = proposalsArray.map((proposal: any) => ({
        ipfsHash: proposal.ipfsHash,
          title: proposal.title,
          votedYes: parseInt(proposal.votedYes.toString(), 10),
          votedNo: parseInt(proposal.votedNo.toString(), 10),
          endTime: proposal.endTime, // Convert timestamp to human-readable format
          executed: proposal.executed,
        }));
  
      setProposals(formattedProposals);
    } catch (err) {
      setError('Failed to fetch proposals')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch proposals on component mount
  useEffect(() => {
    fetchProposals()
  }, [contract, newProposal.title])

  // Create new proposal
  const createProposal = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);

      const metadata = {
        title: newProposal.title,
        description: newProposal.description,
        startTime: newProposal.startTime,
        creator: account,
        timestamp: Math.floor(Date.now() / 1000)
      }

      // Pin to IPFS first
      const ipfsHash = await pinProposalToIPFS(metadata)

      // Store only hash on-chain
      const tx = await contract.createProposal(
        ipfsHash,
        newProposal.title,
        newProposal.startTime
      )

      await tx.wait();

      setNewProposal({
        title: '',
        description: '',
        startTime: Math.floor(Date.now() / 1000) + 3600
      })

    } catch (err) {
      setError('Failed to create proposal')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Cast vote
  const castVote = async (proposalId: number, support: boolean) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.castVote(proposalId, support);
      await tx.wait();
    } catch (err) {
      setError('Failed to cast vote');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          {!account ? (
            <Button
              variant="contained"
              onClick={connectWallet}
              sx={{ mb: 2 }}
            >
              Connect Wallet
            </Button>
          ) : (
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Create Proposal Form */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create New Proposal
              </Typography>
              <Box component="form" sx={{ '& > *': { mb: 2 } }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({
                    ...newProposal,
                    title: e.target.value
                  })}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({
                    ...newProposal,
                    description: e.target.value
                  })}
                />
                <TextField
                  type="datetime-local"
                  label="Start Time"
                  value={new Date(newProposal.startTime * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setNewProposal({
                    ...newProposal,
                    startTime: Math.floor(new Date(e.target.value).getTime() / 1000)
                  })}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={createProposal}
                  disabled={loading || !account}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Proposal'}
                </Button>
              </Box>
            </CardContent>
          </Card>
          {/* Proposals List */}
          {proposals.map((proposal, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{proposal.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {proposal.title}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => castVote(index, true)}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    Vote For
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => castVote(index, false)}
                    disabled={loading}
                  >
                    Vote Against
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </ErrorBoundary>

  );
};