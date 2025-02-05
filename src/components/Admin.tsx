// VotingPlatform.tsx
import { useState, useEffect } from 'react';
import { Base64 } from 'js-base64';
import {
    Button,
    TextField,
    Typography,
    Box,
    Paper,
} from '@mui/material';
import { GoogleModule } from '../types/interfaces';
import { useQuery } from "@tanstack/react-query"
import RefreshIcon from '@mui/icons-material/Refresh';
import { useVoting } from '../context/VotingContext';

// Admin component
const Admin = () => {
    const { contract, account, dispatch } = useVoting();
    const [requiresUpdate, setRequiresUpdate] = useState<GoogleModule[]>([])
    const [balance, setBalance] = useState<number>(0);

    const handleError = (err: any) => {
        dispatch({ type: 'SET_ERROR', payload: err });
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
        if (contract && account && latestSigners) {
            checkAdminAndModuli();
        }
    }, [contract, account, latestSigners]);

    useEffect(() => {
        getRequiresUpdate().catch(console.error)
    }, [contract, latestSigners])

    const checkAdminAndModuli = async () => {
        if (!contract || !account || !latestSigners) {
            console.error('contract, account, or latestSigners not set');
            return;
        }

        try {
            const isAdminResult = await contract.isOwner();
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

            const payload = requiresUpdate.map(jwt => {
                const modulus = jwt.n;
                const parsed = base64UrlToHex(modulus)

                // Add size validation
                if (modulus.length > 514) { // 0x + 512 hex chars
                    throw new Error('Modulus too large');
                }

                return {kid: jwt.kid, modulus: parsed};
            });
            const tx = await contract.addModulus(payload)
            await tx.wait()
            
            setRequiresUpdate([])
        } catch (err) {
            handleError('Failed to update moduli')
            console.error("Failed to update moduli", err)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }




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

    const handleBalanceTransfer = () => {
        if (!contract) {
            console.error('Contract not set');
            return;
        }

        contract.withdrawFees()
            .then((tx) => {
                setBalance(0);
            })
            .catch((err) => {
                console.error('Error withdrawing balance:', err);
            });
    };


    const getBalance = () => {
        if (!contract) {
            return;
        }

        contract.getContractBalance()
            .then((balance) => {
                setBalance(balance);
            })
            .catch((err) => {
                console.error('Error fetching balance:', err);
            });

    }


    useEffect(() => {
        getBalance();
    });

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
                    label="Contract Balance"
                    value={balance}
                />
                <Button
                    variant="contained"
                    onClick={handleBalanceTransfer}
                >
                    Widthdraw Balance
                </Button>
            </Box>
        </Paper>
    </>
    );
};

export default Admin;