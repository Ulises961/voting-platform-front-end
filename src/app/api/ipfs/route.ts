import { ethers } from "ethers"

interface ProposalMetadata {
    title: string
    description: string
    startTime: number
    creator: string
    timestamp: number
}

export async function POST(req: Request) {
    try {
        const { title, description, startTime, creator, timestamp } = await req.json();

        // Sanitize the description
        const sanitizedDescription = sanitize(description);
        const sanitizedTitle = sanitize(title);
        const sanitizedCreator = sanitize(creator);

        // Interact with IPFS to store the sanitized description
        const ipfsHash = await pinToIPFS({ title: sanitizedTitle, description: sanitizedDescription, startTime, creator: sanitizedCreator, timestamp });

        return new Response(JSON.stringify({ ipfsHash }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to post to IPFS' }), { status: 500 });
    }
}

// Function to pin data to IPFS
async function pinToIPFS(metadata: ProposalMetadata): Promise<string> {
    // Implementation for pinning data to IPFS
    // This should interact with your IPFS service
    console.log('Pinning to IPFS:', metadata);
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
        },
        body: JSON.stringify({
            pinataContent: {
                ...metadata
            }
        })
    })

    if (!response.ok) {
        throw new Error(`Failed to pin to IPFS: ${response.statusText}`)
    }

    const result = await response.json()
    return result.IpfsHash
}

export const generateProposalHash = (metadata: ProposalMetadata): string => {
    const encodedData = ethers.solidityPacked(
        ['string', 'string', 'uint256', 'address', 'uint256'],
        [metadata.title, metadata.description, metadata.startTime, metadata.creator, metadata.timestamp]
    )
    return ethers.keccak256(encodedData)
}

// Function to sanitize input
function  sanitize(input: string) : string {
    if (!input) return '';

    // Convert to string if not already
    let sanitized = String(input);

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove script tags and their contents
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove potentially harmful attributes
    sanitized = sanitized.replace(/(on\w+\s*=\s*["'][^"']*["'])/gi, '');

    // Remove control characters and Unicode
    sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // Encode special characters
    sanitized = encodeURIComponent(sanitized);

    // Decode safe characters back
    sanitized = decodeURIComponent(sanitized);

    // Limit length (e.g., 1000 characters)
    sanitized = sanitized.slice(0, 1000);

    return sanitized.trim();
}



