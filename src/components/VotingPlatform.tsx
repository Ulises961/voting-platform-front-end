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
  CircularProgress,
  Paper,
  LinearProgress
} from '@mui/material';
import { ErrorBoundary } from './ErrorBoundary';
import { pinProposalToIPFS } from '../utilities/ipfsUtils';
import { CACHE_DURATION, PROPOSALS_PER_PAGE } from '../config/constants';
import { CachedProposal, Proposal, VotingPlatformProps } from '../types/interfaces';
import { Log } from 'ethers';
import { useProposalBlocks } from '../utilities/proposalsCache';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { LoginForm } from './LoginForm';



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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Form states
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    startTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    allowedDomains: [''] // Add allowed domains array
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
  
      // Use logged in domain if allowedDomains is empty
      let domains = newProposal.allowedDomains;
      if (domains.length === 0 || (domains.length === 1 && domains[0] === '')) {
        const userDomain = userEmail.split('@')[1];
        domains = [userDomain];
      }
  
      const metadata = {
        title: newProposal.title,
        description: newProposal.description,
        startTime: newProposal.startTime,
        creator: account,
        timestamp: Math.floor(Date.now() / 1000),
        allowedDomains: domains
      }
  
      const ipfsHash = await pinProposalToIPFS(metadata);
  
      const tx = await contract.createProposal(
        ipfsHash,
        newProposal.title,
        newProposal.startTime,
        domains
      );
  
      await tx.wait();
  
      setNewProposal({
        title: '',
        description: '',
        startTime: Math.floor(Date.now() / 1000) + 3600,
        allowedDomains: ['']
      });
  
    } catch (err) {
      setError('Failed to create proposal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const checkRegistration = async (domain: string) => {
    if (!contract || !account) return false;
    try {
      const isRegistered = await contract.isVoterRegistered(domain);
      return isRegistered;
    } catch (err) {
      console.error('Error checking registration:', err);
      return false;
    }
  };

  const handleLogin = async (email: string, isRegistering: boolean) => {
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }
  
    try {
      setLoading(true);
      const domain = email.split('@')[1];
      
      if (isRegistering) {
        const tx = await contract.registerWithDomain(domain);
        await tx.wait();
      } else {
        const isRegistered = await contract.isVoterRegistered(domain);
        if (!isRegistered) {
          throw new Error('Domain not registered for this wallet');
        }
      }
      
      setUserEmail(email);
      setIsLoggedIn(true);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process request');
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Container>
        {!account ? (
          // Step 1: Wallet Connection
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant="h6" gutterBottom>
              Please connect your wallet to continue
            </Typography>
            <Button 
              variant="contained" 
              onClick={connectWallet}
              disabled={loading}
            >
              Connect Wallet
            </Button>
          </Box>
        ) : !isLoggedIn ? (
        // Step 2: Email Login with registration check
        <LoginForm 
          onLogin={handleLogin} 
          checkRegistration={checkRegistration}
        />
      ) : (
          // Step 3: Main App Content
          <>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Connected: {account}
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Email: {userEmail}
            </Typography>
            
            {/* Proposal Creation Form */}
            <Paper sx={{ p: 2, mb: 2 }}>
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
                    <TextField
                      fullWidth
                      label="Allowed Domains (comma-separated) leave empty to use your email domain"
                      value={newProposal.allowedDomains.join(',')}
                      onChange={(e) => setNewProposal({
                        ...newProposal,
                        allowedDomains: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                      })}
                      helperText="Enter email domains that can vote, e.g.: gmail.com,yahoo.com"
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
            </Paper>
            
            {/* Proposals List */}
            <Paper sx={{ p: 2 }}>
              {proposals.map((proposal, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{proposal.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Title:</strong> {proposal.title} <br />
                        <strong>Votes For:</strong> {proposal.votedYes} <br />
                        <strong>Votes Against:</strong> {proposal.votedNo} <br />
            
                        <strong>Executed:</strong> {proposal.executed ? 'Yes' : 'No'}
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
            </Paper>
          </>
        )}
        
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <LinearProgress sx={{ mt: 2 }} />
        )}
      </Container>
    </ErrorBoundary>
  );
};