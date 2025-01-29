
// VotingPlatform.tsx
import { useState, useEffect } from 'react';
import { Base64 } from 'js-base64';

declare global {
    interface Window {
        ethereum?: any;
    }
}
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
import { GoogleModule } from '../types/interfaces';
import { useQuery } from "@tanstack/react-query"
import RefreshIcon from '@mui/icons-material/Refresh';

import { useVoting } from '../context/VotingContext';

import { ethers } from 'ethers';

// Admin component
const Admin = () => {
    const { contract, account, isAdmin, loading, dispatch, } = useVoting();
    const [approvedDomains, setApprovedDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [requiresUpdate, setRequiresUpdate] = useState<GoogleModule[]>([])
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [powerLevel, setPowerLevel] = useState('1');
    const [parentDomain, setParentDomain] = useState('');


    const handleError = (err: any) => {
        dispatch({ type: 'SET_ERROR', payload: err });
    }

    const checkUserRegistration = async () => {
        if (!contract) return;
        console.log("checking registration");
        // Get the list of events with the VoterRegistered event so we can check if the user is registered
        const voterRegisteredFilter = contract.filters.VoterRegistered()
        const voterRegisteredEvents = await contract.queryFilter(voterRegisteredFilter)
        console.log('voterRegisteredEvents:', voterRegisteredEvents);
        // Check if the user is registered
        const isRegistered = voterRegisteredEvents.some((event: any) => {
            const addresses: Array<string> = event.args?.map((address: string) => address.toLowerCase());
            return addresses.includes(account);
        });
        // If the user is not registered, register them
        dispatch({ type: 'SET_IS_REGISTERED', payload: isRegistered });
        console.log('isRegistered:', isRegistered);
    }


    const { data: latestSigners } = useQuery({
        queryKey: ["googlejwt"],
        queryFn: async () => {
            return fetch("https://www.googleapis.com/oauth2/v3/certs")
                .then((response) => response.json())
                .then((data) => data as { keys: GoogleModule[] })
        },
    });

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

    useEffect(() => {
        getRequiresUpdate().catch(console.error)
    }, [contract, latestSigners])

    const checkAdminAndModuli = async () => {
        if (!contract || !account || !latestSigners) {
            console.error('contract, account, or latestSigners not set');
            return;
        }

        try {
            const isAdminResult = await contract.admins(account);
            dispatch({ type: 'SET_IS_ADMIN', payload: isAdminResult });

            if (isAdminResult) {
                const currentModuli = await contract.getAllModuli();
                const updatesRequired: GoogleModule[] = [];

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

    const getRequiresUpdate = async () => {
        if (!contract || !latestSigners) {
            return
        }
        //console.log("Getting required update: Latest signers: ", latestSigners)
        const updatesRequired: GoogleModule[] = []
        try {
            const currentModuli = await contract.getAllModuli();
            for (const jwt of latestSigners.keys) {
                const modulus = jwt.n;
                const parsed = base64UrlToHex(modulus)
                if (!currentModuli.includes(parsed)) {
                    updatesRequired.push(jwt)
                }
            }
            setRequiresUpdate(updatesRequired)
        } catch (err) {
            console.error("Error fetching moduli: ", err)
        }

    }

    const updateModuli = async () => {
        if (!contract || !latestSigners) {
            return
        }
        try {
            // TODO: IMPLEMENT SINGLE TRANSACTION TO AVOID CREATING QUEUES
            dispatch({ type: "SET_LOADING", payload: true })
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
            handleError('Failed to update moduli')
            console.error("Failed to update moduli", err)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }

    const REGISTRATION_FEE = ethers.parseEther(process.env.NEXT_PUBLIC_DOMAIN_REGISTRATION_FEE);
    const addDomain = async (domain: string, powerLevel: number, parentDomain: string) => {
        if (!contract || !isAdmin) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
     
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

    const handleAddDomain = () => {
        addDomain(newDomain, Number(powerLevel), parentDomain);
        setNewDomain('');
        setParentDomain('');
        setPowerLevel('1');
    };


    return (<>
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
                    onClick={handleAddDomain}
                    disabled={!newDomain || loading || !powerLevel}
                >
                    Add Domain ({process.env.NEXT_PUBLIC_DOMAIN_REGISTRATION_FEE} ETH)
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
    );
};

export default Admin;