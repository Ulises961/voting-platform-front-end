
// VotingPlatform.tsx
import { useState, useEffect } from 'react';
import { Base64 } from 'js-base64';
import {
    Button,
    TextField,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import { useVoting } from '../context/VotingContext';
import { ethers } from 'ethers';

declare global {
    interface Window {
        ethereum?: any;
    }
}

// Admin component
const DomainPanel = () => {
    const { contract, isAdmin, loading, dispatch, } = useVoting();
    const [approvedDomains, setApprovedDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [powerLevel, setPowerLevel] = useState('1');
    const [parentDomain, setParentDomain] = useState('');
    const [renewDomain, setRenewDomain] = useState('');

    const handleError = (err: any) => {
        dispatch({ type: 'SET_ERROR', payload: err });
    }
  
    const REGISTRATION_FEE = ethers.parseEther(process.env.NEXT_PUBLIC_DOMAIN_REGISTRATION_FEE!);

    const addDomain = async (domain: string, powerLevel: number, parentDomain: string) => {
        if (!contract) return;
        
        try {
            const tx = await contract.addDomain(domain, powerLevel, parentDomain,
                {
                    value : REGISTRATION_FEE
                }
            );
            await tx.wait();
            fetchApprovedDomains();
        } catch (err) {
            handleError(err);
            console.error(err);
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

    const handleAddDomain = () => {
        addDomain(newDomain, Number(powerLevel), parentDomain);
        setNewDomain('');
        setParentDomain('');
        setPowerLevel('1');
    };


    const handleRenewDomain = async () => {
        if (!contract) return;
        try {
            
            const tx = await contract.renewDomain(renewDomain, { value: REGISTRATION_FEE });
            await tx.wait();
            fetchApprovedDomains();
        } catch (err) {
            handleError(err);
            console.error(err);
        }
        setRenewDomain('');
    };

    return (<>
        <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
                Domain Panel
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
                    onClick={handleAddDomain}
                    disabled={!newDomain || loading || !powerLevel}
                >
                    Add Domain ({process.env.NEXT_PUBLIC_DOMAIN_REGISTRATION_FEE} ETH)
                </Button>
                <TextField
                    label="domain"
                    value={renewDomain}
                    onChange={(e) => setRenewDomain(e.target.value)}
                    placeholder="e.g. studenti.unitn.it"
                />
                <Button
                    variant="contained"
                    onClick={handleRenewDomain}
                    disabled={!renewDomain || loading}
                >
                    Renew Domain ({process.env.NEXT_PUBLIC_DOMAIN_REGISTRATION_FEE} ETH)
                </Button>
            </Box>
            <Typography variant="subtitle2">
                Approved Domains:
            </Typography>
            <Button variant="contained" onClick={fetchApprovedDomains}>Refresh</Button>
            <List>
                {approvedDomains.map((domain, index) => (
                    <ListItem key={index}>
                        <ListItemText primary={domain} />
                    </ListItem>
                ))}
            </List>
        </Paper>
    </>
    );
};

export default DomainPanel;