import { useBlockNumber } from 'wagmi'
import { BlockRange } from '../types/interfaces'

export const useProposalBlocks = () => {
  const { data: currentBlock } = useBlockNumber()

  const getBlockRange = async (blocksBack: number = 1000): Promise<BlockRange> => {
    if (!currentBlock) throw new Error('No block number available')
    
    const fromBlock = currentBlock - BigInt(blocksBack)
    return {
      fromBlock: fromBlock > 0n ? fromBlock : 0n,
      toBlock: currentBlock
    }
  }

  const getProposalEvents = async (contract: any, range: BlockRange) => {
    const filter = await contract.filters.ProposalCreated()
    return contract.queryFilter(
      filter,
      range.fromBlock,
      range.toBlock
    )
  }

  return {
    getBlockRange,
    getProposalEvents
  }
}