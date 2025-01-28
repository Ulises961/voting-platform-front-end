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
  DialogContent,
  Dialog,
  DialogTitle,
  Switch,
} from '@mui/material';
import { ErrorBoundary } from './ErrorBoundary';
import { pinProposalToIPFS } from '../utilities/ipfsUtils';
import { JWT, Proposal, VotingPlatformProps } from '../types/interfaces';
import { fromHex, Hex } from 'viem';
import { useQuery } from "@tanstack/react-query"
import RefreshIcon from '@mui/icons-material/Refresh';


// TODO: CURRENT ISSUE: LOGIN DOES NOT WAIT FOR isRegistering TO BE SET TO TRUE
// THUS IT NEVER REGISTERS THE USER :)))

export const VotingPlatform: React.FC<VotingPlatformProps> = ({ contractAddress, contractABI }) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  // const [page, setPage] = useState(0);
  // const [publicClient] = useState(createPublicClient({
  //   chain: hardhat,
  //   transport: http()
  // }));

  // in context
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  //const [userEmail, setUserEmail] = useState('');
  
  
  const [requiresUpdate, setRequiresUpdate] = useState<JWT[]>([])
  // const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [jwt, setJWT] = useState<string | undefined>(undefined)
  
  // Spostato
  const [newDomain, setNewDomain] = useState('');
  const [parentDomain, setParentDomain] = useState('');
  const [powerLevel, setPowerLevel] = useState('1');
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvedDomains, setApprovedDomains] = useState<string[]>([]);
  const [restrictDomain, setRestrictDomain] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  // Spostato
  
  // Form states spostato in Listing
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
  //console.log(latestSigners)


  // moved to Home.tsx
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

  // Spostato in Listing.tsx
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
        endTime: proposal.endTime, // TODO: Convert timestamp to human-readable format
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


  // Moved to Admin.tsx
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
        //console.log("Adding modulus:", parsed, jwt.kid);

        // Add size validation
        if (modulus.length > 514) { // 0x + 512 hex chars
          throw new Error('Modulus too large');
        }

        const tx = await contract.addModulus(jwt.kid, parsed, { gasLimit: 500000 })
        await tx.wait()
      }
      setRequiresUpdate([])
      //await fetchProposals()
    } catch (err) {
      setError('Failed to update moduli')
      console.error("Failed to update moduli", err)
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


  // moved to Home.tsx
  const base64Address = btoa(
    fromHex(account as `0x${string}`, { to: "bytes" }).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  )
    .replace("=", "")
    .replace("+", "-")
    .replaceAll("/", "_");

  //  console.log("base64Address:", base64Address, "   account:", account);

  // Spostato Admin.tsx
  const base64UrlToHex = (n: string): `0x${string}` => {
    try {
      const bytes = Base64.toUint8Array(n.replace(/-/g, '+').replace(/_/g, '/'));
      const hex = Array.from<number>(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      // Ensure the hex string is valid
      if (!/^[0-9a-f]+$/i.test(hex)) {
        throw new Error('Invalid hex string generated');
      }
      return `0x${hex}`;
    } catch (error) {
      console.error('Error converting base64URL to hex:', error);
      throw error;
    }
  };

  // Spostato  Admin.tsx
  const checkUserRegistration = async () => {
    if (!contract) return;
    console.log("checking registration");
    // Get the list of events with the VoterRegistered event so we can check if the user is registered
    const voterRegisteredFilter = contract.filters.VoterRegistered()
    const voterRegisteredEvents = await contract.queryFilter(voterRegisteredFilter)
    console.log('voterRegisteredEvents:', voterRegisteredEvents);
    // Check if the user is registered
    const isRegistered = voterRegisteredEvents.some((event: any) => {
      const addresses:Array<string> = event.args?.map((address: string) => address.toLowerCase());     
      return addresses.includes(account);
    });
    // If the user is not registered, register them
    console.log('isRegistered:', isRegistered);
    setIsRegistering(false);
    if (!isRegistered) {
      console.log('User is not registered');
      setIsRegistering(true);
    }
  }

  // moved to Home.tsx
  const handleGoogleLogin = async (credentialResponse: any) => {
    //console.log("handleLogin", credentialResponse);

    if (credentialResponse.credential) {
      //console.log("credentialResponse.credential", credentialResponse.credential);

      if (!contract || !account) {
        setError('Please connect your wallet first');
        console.error('Contract or account not set');
        return;
      }

      setJWT(credentialResponse.credential);
    }
  }
  
 // Spostato LoginForm.tsx
  const handleLogin = async () => {
    if (isRegistering || !contract || !latestSigners) {
      return
    }

    try {
      const { header, payload, hexSig } = parseJwt(jwt as string);
      const tx = await contract.login(header, payload, hexSig);
      setIsLoggedIn(tx);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process request');
      setIsLoggedIn(false);
      return;
    }
  };

  // Spostato login
  const handleRegister = async () => {
    if (!isRegistering || !contract || !latestSigners) { return; }
    try {
      const { header, payload, hexSig } = parseJwt(jwt as string);
      const tx = await contract.registerWithDomain(header, payload, hexSig);
      await tx.wait();
      setIsRegistering(false);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process request');
      setIsRegistering(true);
      return;
    }
  };

  // moved to Admin.tsx
  // USE EFFECT TO UPDATE MODULI IF ISADMIN == TRUE 
  useEffect(() => {
    console.log('States updated:', {
      hasContract: !!contract,
      hasAccount: !!account,
      hasLatestSigners: !!latestSigners
    });
    if (contract && account && latestSigners) {
      checkAdminAndModuli();
      checkUserRegistration();
    }
  }, [contract, account, latestSigners, isRegistering]);


  // moved to Admin.tsx
  const checkAdminAndModuli = async () => {
    if (!contract || !account || !latestSigners) {
      console.error('contract, account, or latestSigners not set');
      return;
    }

    try {
      const isAdminResult = await contract.admins(account);
      setIsAdmin(isAdminResult);

      if (isAdminResult) {
        const currentModuli = await contract.getAllModuli();
        const updatesRequired: JWT[] = [];

        for (const jwt of latestSigners.keys) {
          const modulus = jwt.n;
          const parsed = base64UrlToHex(modulus);
          if (!currentModuli.includes(parsed)) {
            updatesRequired.push(jwt);
          }
        }

        if (updatesRequired.length > 0) {
          setRequiresUpdate(updatesRequired);
        }
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };



  // Spostato
  const getRequiresUpdate = async () => {
    if (!contract || !latestSigners) {
      return
    }
    //console.log("Getting required update: Latest signers: ", latestSigners)
    const updatesRequired: JWT[] = []
    try {
      const currentModuli = await contract.getAllModuli();
      for (const jwt of latestSigners.keys) {
        const modulus = jwt.n;
        const parsed = base64UrlToHex(modulus)
        if (!currentModuli.includes(parsed)) {
          updatesRequired.push(jwt)
        } else {
          //console.log("Modulus already exists: ", currentModuli.includes(parsed))
        }
      }
      setRequiresUpdate(updatesRequired)
    } catch (err) {
      console.error("Error fetching moduli: ", err)
    }

  }


  // Fetch moduli updates on component mount /// Spostato
  useEffect(() => {
    getRequiresUpdate().catch(console.error)
  }, [contract, latestSigners])

  // Spostato in Listing.tsx
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
        restrictDomain
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


  // Cast vote Spostato in Listing
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

  // spostato ma non serve
  // const checkRegistration = async (domain: string) => {
  //   if (!contract || !account) return false;
  //   try {
  //     const isRegistered = await contract.isDomainRegistered(domain);
  //     return isRegistered;
  //   } catch (err) {
  //     console.error('Error checking registration:', err);
  //     return false;
  //   }
  // };

  // moved to Home.tsx
  // Add admin check
  const checkAdminStatus = async () => {
    if (!contract || !account) return;
    try {
      const isAdminResult = await contract.isAdmin(account);
      //console.log('isAdminResult:', isAdminResult);
      setIsAdmin(isAdminResult);
    } catch (err) {
      console.error('Error checking admin:', err);
    }
  };

  
  // moved to Admin.tsx
  // Add domain management for admins
  const addDomain = async (domain: string, powerLevel: number, parentDomain: string) => {
    if (!contract || !isAdmin) return;
    try {
      const tx = await contract.addDomain(domain, powerLevel, parentDomain);
      await tx.wait();
      fetchApprovedDomains();
    } catch (err) {
      setError('Failed to add domain');
      console.error(err);
    }
  };

  // moved to Admin.tsx
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
          ) : (
            <>
              {/* Always show admin panel if isAdmin */}
              {isAdmin && (
                <>
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
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Admin Panel
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                      <TextField
                        label="New Domain"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="e.g. studenti.unitn.it"
                      />
                      <TextField
                        label="Parent Domain (optional)"
                        value={parentDomain}
                        onChange={(e) => setParentDomain(e.target.value)}
                        placeholder="e.g. unitn.it"
                      />
                      <TextField
                        label="Power Level"
                        type="number"
                        value={powerLevel}
                        onChange={(e) => setPowerLevel(e.target.value)}
                        slotProps={{ input: { min: "1" } }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => {
                          console.log('Restrict domain:', restrictDomain);
                          addDomain(newDomain, Number(powerLevel), parentDomain);
                          setNewDomain('');
                          setParentDomain('');
                          setPowerLevel('1');
                        }}
                        disabled={!newDomain || loading || !powerLevel}
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
                </>
              )}

              {/* Show Google login if not logged in */}
              {!jwt && (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Please login with Google
                  </Typography>
                  <GoogleLogin
                    nonce={base64Address}
                    onSuccess={handleGoogleLogin}
                    onError={() => {
                      setError('Login failed, please try again');
                    }}
                  />
                </Box>
              )}
              {isRegistering && jwt && (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Please register with the contract
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleRegister}
                    disabled={loading}
                  >
                    Register
                  </Button>
                </Box>
              )}

              {
                !isLoggedIn && !isRegistering && jwt && (
                  <Box sx={{ textAlign: 'center', my: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Please login with the contract
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleLogin}
                      disabled={loading}
                    >
                      Login
                    </Button>
                  </Box>
                )
              }

              {/* Show main content if logged in */}
              {isLoggedIn && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Connected: {account}
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>Restrict Domain:</Typography>
                          <Switch
                            checked={restrictDomain}
                            onChange={(e) => setRestrictDomain(e.target.checked)}
                          />
                          </Box>
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
                            <strong>ID</strong> {proposal.ipfsHash} <br />
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
          {/*<UpdateModal />*/}
        </Container>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
};