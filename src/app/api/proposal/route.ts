import { NextResponse } from 'next/server';
import * as isIPFS from 'is-ipfs';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../../../contracts/votingPlatform';
import { ProposalParams } from '@/types/interfaces';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export async function POST(request: Request) {
    const { ipfsHash, creator, restrictDomain } = await request.json();

    // Validate input
    const validationError = validateProposalInput({ ipfsHash, creator, restrictDomain } as ProposalParams);
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    try {
        // Connect to the blockchain network
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        
        // Get the signer using the creator's address
        const signer = await provider.getSigner(process.env.BACKEND_WALLET_ADDRESS);
        
        // Create contract instance
        const contract = new ethers.Contract(
            contractAddress as string,
            CONTRACT_ABI,
            signer
        );

        console.log('Contract:', contract);
        
        // Send proposal to the smart contract
        const tx = await contract.createProposal(ipfsHash, creator, true);
        const receipt = await tx.wait();

        return NextResponse.json({
            success: true,
            transactionHash: receipt.hash
        }, { status: 200 });

    } catch (error) {
        console.error('Contract error:', error);
        return NextResponse.json({
            error: 'Failed to prepare transaction data'
        }, { status: 500 });
    }
}

function validateProposalInput({ ipfsHash, creator, restrictDomain }: ProposalParams): boolean {
    if (!ipfsHash || !creator || !restrictDomain) {
        return false;
    }

    if (typeof ipfsHash !== 'string' || typeof creator !== 'string' || typeof restrictDomain !== 'boolean') {
        return false;
    }
    if (!ethers.isAddress(creator) || !isIPFS.multihash(ipfsHash)) {
        return false;
    }
    return true;
}