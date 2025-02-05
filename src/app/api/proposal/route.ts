import { NextResponse } from 'next/server';
import * as isIPFS from 'is-ipfs';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../../../contracts/votingPlatform';
import { ProposalParams } from '@/types/interfaces';
import { useState } from 'react';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
 
export async function POST(request: Request) {
    const { ipfsHash, creator, restrictDomain, domain } = await request.json();
    const [domainProposals, setDomainProposals] = useState<Map<string, number>>(new Map());
    const domainProposalsNumber = domainProposals.get(domain) || 0;
    
    if(domainProposalsNumber > parseInt(process.env.BACKEND_DOMAIN_LIMIT!)) {
        return NextResponse.json({ error: 'Domain limit reached' }, { status: 400 });   
    } 

    setDomainProposals(prev => {
        const newDomainProposals = new Map(prev);
        newDomainProposals.set(domain, domainProposalsNumber + 1);
        return newDomainProposals;
    });

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
       
        // Send proposal to the smart contract
        const tx = await contract.createProposal(ipfsHash, creator, restrictDomain);
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