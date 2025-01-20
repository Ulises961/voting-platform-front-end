import { ethers } from "ethers"
import { CACHE_DURATION, PROPOSALS_PER_PAGE } from "../config/constants"
import { CachedProposal } from "../types/interfaces"

export async function getProposalsCache(contract: ethers.Contract, page: number) {
    const filter = contract.filters.ProposalCreated()
    const provider = contract.provider
    const blockNumber = await provider.getBlockNumber()
    const events = await contract.queryFilter(
        filter,
        blockNumber - 1000,
        blockNumber
    )

    // Get cached proposals
    const cachedData = localStorage.getItem('proposals')
    const cachedProposals: Record<string, CachedProposal> =
        cachedData ? JSON.parse(cachedData) : {}

    // Update only stale or new proposals
    const now = Date.now()
    const updatedProposals = await Promise.all(
        events.map(async (event) => {
            const [ipfsHash, title] = event.args || []
            const cached = cachedProposals[ipfsHash]

            if (cached && now - cached.lastUpdated < CACHE_DURATION) {
                return cached
            }

            try {
                const proposal = await contract.proposals(ipfsHash)
                return {
                    ipfsHash,
                    title: proposal.title,
                    votedYes: Number(proposal.votedYes),
                    votedNo: Number(proposal.votedNo),
                    endTime: Number(proposal.endTime),
                    executed: proposal.executed,
                    lastUpdated: now
                }
            } catch (error) {
                console.error(`Error fetching proposal ${ipfsHash}:`, error)
                return null
            }
        })
    )

    // Update cache
    const newCache = updatedProposals.reduce((acc, proposal) => {
        if (proposal) {
            acc[proposal.ipfsHash] = proposal
        }
        return acc
    }, cachedProposals)

    localStorage.setItem('proposals', JSON.stringify(newCache))

    // Paginate results
   return  Object.values(newCache)
        .slice(page * PROPOSALS_PER_PAGE, (page + 1) * PROPOSALS_PER_PAGE)
}