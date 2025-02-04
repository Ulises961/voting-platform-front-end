import { useEffect, useState } from 'react';

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
    CircularProgress,
    Paper,
    Switch,
    Stack,
} from '@mui/material';
import { Proposal } from '../types/interfaces';
import { useVoting } from '../context/VotingContext';


const Listing = () => {
    const { contract, account, isLoggedIn, loading, dispatch, } = useVoting();
    const [newProposal, setNewProposal] = useState({
        title: '',
        description: '',
        startTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    });
    const [restrictDomain, setRestrictDomain] = useState(false);
    const [proposals, setProposals] = useState<Proposal[]>([]);

    const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading });
    const setError = (error: string) => dispatch({ type: 'SET_ERROR', payload: error });

    const createProposal = async () => {
        if (!account) return;

        try {
            setLoading(true);

            const response = await fetch('/api/ipfs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: newProposal.title,
                    description: newProposal.description,
                    startTime: newProposal.startTime,
                    creator: account,
                    timestamp: Math.floor(Date.now() / 1000)
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to post to IPFS');
            }

            const { ipfsHash } = await response.json();

            const proposalResponse = await fetch('/api/proposal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ipfsHash,
                    creator: account,
                    restrictDomain,
                }),
            });

            const { data } = await proposalResponse.json();



            if (!proposalResponse.ok) {
                throw new Error('Failed to create proposal');
            }

            await fetchProposals();
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProposals = async () => {
        if (!contract) return;

        try {
            setLoading(true);
            const proposalsArray = await contract.getAllProposals();
            const formattedProposals = proposalsArray.map((proposal: any) => ({
                ipfsHash: proposal.ipfsHash,
                votedYes: parseInt(proposal.votedYes.toString(), 10),
                votedNo: parseInt(proposal.votedNo.toString(), 10),
                endTime: proposal.endTime, // TODO: Convert timestamp to human-readable format
                restrictDomain: proposal.restrictDomain,
            }));

            const fullProposals = fetchPinataProposals(formattedProposals);
            const proposalData = await Promise.all(fullProposals);

            setProposals(proposalData);
        } catch (err) {
            setError('Failed to fetch proposals')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
    
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

    const fetchPinataProposals = (proposals: Proposal[]): Promise<Proposal>[] => {
        const fullProposals = proposals.map(async (proposal) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${proposal.ipfsHash}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch proposals from Pinata');
            }

            const data = await response.text().then(data => JSON.parse(data));
            const updatedProposal = { ...proposal, description: data.description, title: data.title, creator: data.creator, startTime: data.startTime, timestamp: data.timestamp };

            console.log(updatedProposal);

            return updatedProposal as Proposal;
        });
        return fullProposals;
    }

    useEffect(() => {
        if (isLoggedIn) {
            fetchProposals();
        }
    }, [isLoggedIn]);
    

    return (
        <>
            {isLoggedIn && (
                <>
                    {/* Proposal Creation Form */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6" gutterBottom>
                                        Create New Proposal
                                    </Typography>
                                    <Box component="form" sx={{ '& > *': { mb: 2 } }}>
                                        <Stack spacing={2}>
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
                                                disabled={loading || !account || !newProposal.title.trim() || !newProposal.description.trim()}
                                            >
                                                {loading ? <CircularProgress size={24} /> : 'Create Proposal'}
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Stack>
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
                                    <Stack spacing={2} sx={{ mb: 2 }}>
                                        <Typography variant="h6">{proposal.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Title:</strong> {proposal.title} <br />
                                            <strong>Description:</strong> {proposal.description} <br />
                                            <strong>Piñata Object ID</strong> {proposal.ipfsHash} <br />
                                            <strong>Votes For:</strong> {proposal.votedYes} <br />
                                            <strong>Votes Against:</strong> {proposal.votedNo} <br />
                                            <strong>Executed:</strong> {proposal.endTime > new Date().getTime() ? 'Yes' : 'No'}
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
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Paper>
                </>

            )
            }
        </>
    );
}

export default Listing;