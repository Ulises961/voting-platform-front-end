// VotingPlatform.tsx
import React, { useEffect } from 'react';
import { ethers } from 'ethers';
import { GoogleLogin } from "@react-oauth/google"
import { GoogleOAuthProvider } from '@react-oauth/google';

declare global {
    interface Window {
        ethereum?: any;
    }
}
import {
    Button,
    Typography,
    Box,
    Container,
} from '@mui/material';
import { ErrorBoundary } from './ErrorBoundary';
import { VotingPlatformProps } from '../types/interfaces';
import { fromHex } from 'viem';
import { useVoting } from '../context/VotingContext';
import Admin from './Admin';
import Listing from './Listing';
import Login from './Login';


const Home: React.FC<VotingPlatformProps> = ({ contractAddress, contractABI }) => {
    const { contract, account, jwt, loading, dispatch, isAdmin, isLoggedIn } = useVoting();

    const handleError = (err: any) => {
        dispatch({ type: 'SET_ERROR', payload: err });
    };

    const setIsAdmin = (isAdmin: boolean) => {
        dispatch({ type: 'SET_IS_ADMIN', payload: isAdmin });
    }

    const setAccount = (account: string) => {
        dispatch({ type: 'SET_ACCOUNT', payload: account });
    };

    const setContract = (contract: any) => {
        dispatch({ type: 'SET_CONTRACT', payload: contract });
    };

    const setJWT = (jwt: string) => {
        dispatch({ type: 'SET_JWT', payload: jwt });
    };

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
                handleError('Please install MetaMask');
            }
        } catch (err) {
            handleError('Failed to connect wallet');
            console.error(err);
        }
    };

    const checkAdmin = async () => {
        if (!contract || !account) return;
        try {
            const isAdminResult = await contract.isAdmin(account);
            //console.log('isAdminResult:', isAdminResult);
            setIsAdmin(isAdminResult);
        } catch (err) {
            console.error('Error checking admin:', err);
        }
    };

    useEffect(() => {
        checkAdmin();
        checkUserRegistration();
    }, [account, contract]);

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
        dispatch({ type: 'SET_IS_REGISTERED', payload: false });
        if (!isRegistered) {
          console.log('User is not registered');
          dispatch({ type: 'SET_IS_REGISTERED', payload: true });
        }
      }
    


    const base64Address = btoa(
        fromHex(account as `0x${string}`, { to: "bytes" }).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
        )
    )
        .replace("=", "")
        .replace("+", "-")
        .replaceAll("/", "_");


    const handleGoogleLogin = async (credentialResponse: any) => {
        //console.log("handleLogin", credentialResponse);

        if (credentialResponse.credential) {
            //console.log("credentialResponse.credential", credentialResponse.credential);

            if (!contract || !account) {
                handleError('Please connect your wallet first');
                console.error('Contract or account not set');
                return;
            }

            setJWT(credentialResponse.credential);
        }
    }
  
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
                                            handleError('Login failed, please try again');
                                        }}
                                    />
                                </Box>
                            )}
                            {
                                jwt && isAdmin && (
                                    <Box sx={{ textAlign: 'center', my: 4 }}>
                                        <Admin />
                                    </Box>
                                )
                            }

                            {
                                jwt && (
                                    <Box sx={{ textAlign: 'center', my: 4 }}>
                                        <Login />
                                    </Box>
                                )
                            }

                            {
                                isLoggedIn && (
                                    <Box sx={{ textAlign: 'center', my: 4 }}>
                                        <Listing />
                                    </Box>
                                )
                            }
                        </>
                    )}
                </Container>
            </ErrorBoundary>
        </GoogleOAuthProvider>
    );
}

export default Home;