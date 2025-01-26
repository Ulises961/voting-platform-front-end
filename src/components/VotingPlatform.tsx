// VotingPlatform.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Base64 } from 'js-base64';
import { Buffer } from 'buffer';
import { GoogleLogin } from "@react-oauth/google"
import { GoogleOAuthProvider } from '@react-oauth/google';

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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ErrorBoundary } from './ErrorBoundary';
import { pinProposalToIPFS } from '../utilities/ipfsUtils';
import { JWT, Proposal, VotingPlatformProps } from '../types/interfaces';
import { createPublicClient, fromHex, Hex, http } from 'viem';
import { hardhat } from 'viem/chains';
import { LoginForm } from './LoginForm';
import { useQuery } from "@tanstack/react-query"
import RefreshIcon from '@mui/icons-material/Refresh';
import { config } from 'process';
import { PINATA_GATEWAY } from '../config/constants';


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
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvedDomains, setApprovedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');

  const [requiresUpdate, setRequiresUpdate] = useState<JWT[]>([])
  const [jwt, setJWT] = useState<string | undefined>(undefined)

  // Form states
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    startTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  });

  const { data: latestSigners } = useQuery({
    queryKey: ["googlejwt"],
    queryFn: async () => {
      return fetch("https://www.googleapis.com/oauth2/v3/certs")
        .then((response) => response.json())
        .then((data) => data as { keys: JWT[] })
    },
  })
  console.log(latestSigners)

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
      // fetchPinataProposals(formattedProposals);
      setProposals(formattedProposals);
    } catch (err) {
      setError('Failed to fetch proposals')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // const fetchPinataProposals = async (proposals: Proposal[]) => {
  //   const pinataProposals = await Promise.all(proposals.map(async (proposal) => {
  //     const ipfsData = await publicClient.get(pinataKeys[0], proposal.ipfsHash);
  //     return {
  //       ...proposal,
  //       description: ipfsData.description,
  //       creator: ipfsData.creator,
  //       timestamp: ipfsData.timestamp,
  //     };
  //   });
  //   setProposals(pinataProposals);
  // };

  const updateModuli = async () => {
    if (!contract || !latestSigners) {
      return
    }
    try {
      // TODO: IMPLEMENT SINGLE TRANSACTION TO AVOID CREATING QUEUES
      setLoading(true)
      for (const jwt of requiresUpdate) {
        const modulus = jwt.n;
        const parsed = base64UrlToHex(modulus)
        const tx = await contract.addModulus(jwt.kid, parsed)
        await tx.wait()
      }
      setRequiresUpdate([])
      //await fetchProposals()
    } catch (err) {
      setError('Failed to update moduli')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function parseJwt(token: string) {
    return {
      header: Buffer.from(token.split(".")[0], "base64").toString(),
      payload: Buffer.from(token.split(".")[1], "base64").toString(),
      hexSig: ("0x" +
        Buffer.from(token.split(".")[2], "base64").toString("hex")) as Hex,
    }
  }

  // const base64Address = btoa(
  //   fromHex(account, { to: "bytes" }).reduce(
  //     (data, byte) => data + String.fromCharCode(byte),
  //     ""
  //   )
  // )
  //   .replace("=", "")
  //   .replace("+", "-")
  //   .replaceAll("/", "_")

  const base64UrlEncode = (address: string): string => {
    const bytes = new Uint8Array(address.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      const hexByte = address.slice(i * 2, i * 2 + 2);
      bytes[i] = parseInt(hexByte, 16);
    }

    const binaryString = Array.from(bytes)
      .map(byte => String.fromCharCode(byte))
      .join('');

    return btoa(binaryString)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const base64UrlToHex = (n: string): `0x${string}` => {
    const bytes = Base64.toUint8Array(n.replace(/-/g, '+').replace(/_/g, '/'));
    return `0x${Array.from<number>(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  };

  const getRequiresUpdate = async () => {
    if (!contract || !latestSigners) {
      return
    }
    console.log("Getting required update: Latest signers: ", latestSigners)
    const updatesRequired: JWT[] = []
    try {
      const currentModuli = await contract.getAllModuli();
      for (const jwt of latestSigners.keys) {
        const modulus = jwt.n;
        const parsed = base64UrlToHex(modulus)
        console.log("Checking modulus:", parsed)
        if (!currentModuli.includes(parsed)) {
          updatesRequired.push(jwt)
        } else {
          console.log("Modulus already exists: ", currentModuli.includes(parsed))
        }
      }
      setRequiresUpdate(updatesRequired)
    } catch (err) {
      console.error("Error fetching moduli: ", err)
    }

  }

  // Fetch proposals on component mount
  useEffect(() => {
    // fetchProposals()
    getRequiresUpdate().catch(console.error)
  }, [contract, latestSigners])

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
      };

      const ipfsHash = await pinProposalToIPFS(metadata);

      const tx = await contract.createProposal(
        ipfsHash,
        newProposal.title,
        newProposal.startTime
      );

      await tx.wait();
      await fetchProposals();
    } catch (err) {
      setError('Failed to create proposal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Cast vote
  const castVote = async (proposalId: string, support: boolean) => {
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
      const isRegistered = await contract.isDomainRegistered(domain);
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
      const { header, payload, hexSig } = parseJwt(jwt as string);

      if (isRegistering) {
        const tx = await contract.registerWithDomain(header, payload, hexSig);
        await tx.wait();
      } else {
        const tx = await contract.login(header, payload, hexSig);
        await tx.wait();
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

  // Add admin check
  const checkAdminStatus = async () => {
    if (!contract || !account) return;
    try {
      const isAdminResult = await contract.isAdmin(account);
      console.log('isAdminResult:', isAdminResult);
      setIsAdmin(isAdminResult);
    } catch (err) {
      console.error('Error checking admin:', err);
    }
  };

  // Add domain management for admins
  const addDomain = async (domain: string) => {
    if (!contract || !isAdmin) return;
    try {
      const tx = await contract.addDomain(domain);
      await tx.wait();
      console.log('Domain added:', domain);
      fetchApprovedDomains();
    } catch (err) {
      setError('Failed to add domain');
    }
  };

  const fetchApprovedDomains = async () => {
    if (!contract) return;
    try {
      const domains = await contract.getDomains();
      setApprovedDomains(domains);
    } catch (err) {
      console.error('Error fetching domains:', err);
    }
  };

  useEffect(() => {
    if (contract && account) {
      checkAdminStatus();
      fetchApprovedDomains();
    }
  }, [contract, account]);

  return (
    <GoogleOAuthProvider clientId="148714805290-dj5sljtj437rr5nu8hcpo85pm869201e.apps.googleusercontent.com">
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
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="h6" gutterBottom>
                Please login with Google
              </Typography>
              <GoogleLogin
                nonce={base64UrlEncode(account)}
                onSuccess={(credentialResponse: any) => {
                  if (credentialResponse.credential) {
                    console.log(credentialResponse.credential);
                    parseJwt(credentialResponse.credential);
                    setJWT(credentialResponse.credential);
                    setIsLoggedIn(true);
                  }
                }}
                onError={() => {
                  setError('Login failed, please try again');
                }}
              />
            </Box>
          ) : (
            <>
              {requiresUpdate.length > 0 && isAdmin && (
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={updateModuli}
                    startIcon={<RefreshIcon />}
                  >
                    {`${requiresUpdate.length} Updates Required`}
                  </Button>
                </Box>
              )}
              {/* Admin Panel */}
              {isAdmin && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Admin Panel
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      label="New Domain"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="e.g. gmail.com"
                    />
                    <Button
                      variant="contained"
                      onClick={() => {
                        addDomain(newDomain);
                        setNewDomain('');
                      }}
                      disabled={!newDomain || loading}
                    >
                      Add Domain
                    </Button>
                  </Box>

                  <Typography variant="subtitle2">
                    Approved Domains:
                  </Typography>
                  <List>
                    {approvedDomains.map((domain, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={domain} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {isLoggedIn ? (
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
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={fetchProposals}
                      disabled={loading}
                    >
                      Refresh Proposals
                    </Button>
                  </Box>
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
                              onClick={() => castVote(proposal.ipfsHash, true)}
                              disabled={loading}
                              sx={{ mr: 1 }}
                            >
                              Vote For
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => castVote(proposal.ipfsHash, false)}
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
              ) : (
                <div style={{ backgroundColor: 'white', padding: '20px' }}>
                  <LoginForm
                    onLogin={handleLogin}
                    checkRegistration={checkRegistration}
                  />
                </div>
              )}
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
    </GoogleOAuthProvider>
  );
};