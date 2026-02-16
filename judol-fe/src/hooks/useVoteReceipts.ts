import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import GovernanceDAOABI from '@/contracts/abis/GovernanceDAO.json';

const GOVERNANCE_DAO_ADDRESS = import.meta.env.VITE_GOVERNANCE_DAO_ADDRESS as `0x${string}`;

const getRpcUrl = () => {
  return import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
};

export interface VoteReceipt {
  proposalId: number;
  voter: string;
  support: boolean;
  weight: bigint;
  timestamp: number;
  txHash: string;
}

/**
 * Hook to fetch user's voting history
 */
export const useVoteReceipts = (userAddress?: string) => {
  return useQuery({
    queryKey: ['governance', 'voteReceipts', userAddress],
    queryFn: async (): Promise<VoteReceipt[]> => {
      if (!userAddress || !GOVERNANCE_DAO_ADDRESS) {
        return [];
      }

      try {
        const provider = new ethers.JsonRpcProvider(getRpcUrl());
        const contract = new ethers.Contract(
          GOVERNANCE_DAO_ADDRESS,
          GovernanceDAOABI.abi,
          provider
        );

        // Get the event filter for this user's votes
        const filter = contract.filters.Voted(null, userAddress);

        // Query logs from the last 1000 blocks (or use a specific block range)
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50000); // Last ~50k blocks

        const logs = await provider.getLogs({
          ...filter,
          fromBlock,
          toBlock: 'latest',
        });

        // Parse the logs
        const iface = new ethers.Interface(GovernanceDAOABI.abi);
        const voteReceipts: VoteReceipt[] = [];

        for (const log of logs) {
          try {
            const parsed = iface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });

            if (parsed && parsed.name === 'Voted') {
              const [proposalId, voter, support, weight] = parsed.args;
              
              // Get block timestamp
              const block = await provider.getBlock(log.blockNumber);
              const timestamp = block?.timestamp || 0;

              voteReceipts.push({
                proposalId: Number(proposalId),
                voter: voter as string,
                support: support as boolean,
                weight: weight as bigint,
                timestamp,
                txHash: log.transactionHash,
              });
            }
          } catch (e) {
            // Skip logs that don't parse correctly
          }
        }

        // Sort by timestamp, newest first
        return voteReceipts.sort((a, b) => b.timestamp - a.timestamp);
      } catch (error) {
        console.error('Error fetching vote receipts:', error);
        return [];
      }
    },
    enabled: !!userAddress && !!GOVERNANCE_DAO_ADDRESS,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
