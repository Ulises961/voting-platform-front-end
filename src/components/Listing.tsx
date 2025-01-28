import { useState } from 'react';

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
} from '@mui/material';
import { pinProposalToIPFS } from '../utilities/ipfsUtils';
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
            console.log('Metadata:', metadata);
            
            const ipfsHash = await pinProposalToIPFS(metadata);
            console.log('IPFS Hash:', ipfsHash);
            
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

    return (
        <>
        Listing
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
                                        disabled={loading || !account || !newProposal.title.trim() || !newProposal.description.trim()}
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
    );
}

export default Listing;