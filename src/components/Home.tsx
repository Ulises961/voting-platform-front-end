// VotingPlatform.tsx
import React, { useEffect } from 'react';
import { ethers } from 'ethers';
import { GoogleLogin } from "@react-oauth/google"
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from './ErrorBoundary';
import { VotingPlatformProps } from '../types/interfaces';
import { fromHex } from 'viem';
import { useVoting } from '../context/VotingContext';
import Listing from './Listing';
import Login from './Login';

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


const Home: React.FC<VotingPlatformProps> = ({ contractAddress, contractABI }) => {
    const { contract, account, jwt, loading, dispatch, isLoggedIn } = useVoting();
    const router = useRouter();

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
            const isAdminResult = await contract.isOwner();
            setIsAdmin(isAdminResult);
        } catch (err) {
            console.error('Error checking admin:', err);
        }
    };

    useEffect(() => {
        checkAdmin();
    }, [account, contract]);


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
        if (credentialResponse.credential) {

            if (!contract || !account) {
                handleError('Please connect your wallet first');
                console.error('Contract or account not set');
                return;
            }

            setJWT(credentialResponse.credential);
        }
    }
    useEffect(() => {
        //
        if (isLoggedIn) {
            router.push('/proposals');
        } else if (account && !jwt) {
            // Has wallet but no Google auth
            router.push('/');
        } else if (!account) {
            // No wallet connected
            router.push('/');
        }
    }, [isLoggedIn, account, jwt, router]);

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!}>
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
                            {!jwt ? (
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
                            ) : (
                                <>
                                    <Box sx={{ textAlign: 'center', my: 4 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Welcome to the UniTn Voting  Platform
                                        </Typography>
                                    </Box>
                                    {isLoggedIn ? (
                                        <Listing />
                                    ) : (
                                        <Login />
                                    )}
                                </>
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