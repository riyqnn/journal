import { useQuery } from '@tanstack/react-query';
import { useContract } from './useContract';
import { useGovernance } from './useGovernance';
import { useVerifier } from './useVerifier';
import { useUSDC } from './useUSDC';
import { PaperStatus } from './useContract';

/**
 * React Query integration for contract data fetching
 * Optimized for real-time updates without blocking UI
 */

/**
 * Fetch all papers with pagination and caching
 * @param offset Starting index for pagination
 * @param limit Maximum number of papers to fetch
 */
export const useAllPapers = (offset = 0, limit = 20) => {
  const { getAllPapers } = useContract();

  return useQuery({
    queryKey: ['papers', 'all', offset, limit],
    queryFn: () => getAllPapers(offset, limit),
    staleTime: 60_000, // 1 minute cache
    gcTime: 300_000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch papers by status with caching
 * No auto-refresh - only refetch on user action
 * @param status Status to filter by
 */
export const usePapersByStatus = (status: PaperStatus) => {
  const { getAllPapers } = useContract();

  return useQuery({
    queryKey: ['papers', 'status', status],
    queryFn: async () => {
      const allPapers = await getAllPapers(0, 100);
      const statusMap = ['Draft', 'Verified', 'Rejected', 'DataPool'];
      return allPapers.filter(p => p.status === statusMap[status]);
    },
    staleTime: 300_000, // 5 minutes cache - no auto-refresh
    gcTime: 600_000, // Keep in cache for 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    // NO refetchInterval - prevents RPC spam
  });
};

/**
 * Fetch total supply of papers
 */
export const useTotalSupply = () => {
  const { getTotalSupply } = useContract();

  return useQuery({
    queryKey: ['papers', 'totalSupply'],
    queryFn: () => getTotalSupply(),
    staleTime: 120_000, // 2 minutes cache
    gcTime: 300_000,
    retry: 3,
  });
};

/**
 * Fetch paper metadata by token ID
 * @param tokenId Token ID to fetch
 */
export const usePaperMetadata = (tokenId: string) => {
  const { getPaperMetadata } = useContract();

  return useQuery({
    queryKey: ['paper', 'metadata', tokenId],
    queryFn: () => getPaperMetadata(tokenId),
    enabled: !!tokenId && tokenId !== 'PENDING',
    staleTime: 300_000, // 5 minutes cache - metadata doesn't change often
    gcTime: 600_000,
    retry: 3,
  });
};

/**
 * Fetch all governance proposals
 * No auto-refresh - prevents RPC spam
 */
export const useGovernanceProposals = () => {
  const { getAllProposals } = useGovernance();

  return useQuery({
    queryKey: ['governance', 'proposals'],
    queryFn: async () => {
      // Fetch ALL proposals (not just active ones)
      const proposals = await getAllProposals();
      return proposals;
    },
    staleTime: 300_000, // 5 minutes cache - no auto-refresh
    gcTime: 600_000, // Keep in cache for 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    // NO refetchInterval - prevents RPC spam
  });
};

/**
 * Fetch verifier stats
 * No auto-refresh - prevents RPC spam
 * @param address Verifier wallet address
 */
export const useVerifierStats = (address?: string) => {
  const { getVerifierStats } = useVerifier();

  return useQuery({
    queryKey: ['verifier', 'stats', address],
    queryFn: async () => {
      if (!address) return null;
      return await getVerifierStats(address);
    },
    enabled: !!address,
    staleTime: 300_000, // 5 minutes cache - no auto-refresh
    gcTime: 600_000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    // NO refetchInterval - prevents RPC spam
  });
};

/**
 * Fetch USDC balance
 * No auto-refresh - prevents RPC spam
 * @param address Wallet address
 */
export const useUSDCBalance = (address?: string) => {
  const { getBalance } = useUSDC();

  return useQuery({
    queryKey: ['usdc', 'balance', address],
    queryFn: async () => {
      if (!address) return null;
      return await getBalance(address);
    },
    enabled: !!address,
    staleTime: 300_000, // 5 minutes cache - no auto-refresh
    gcTime: 600_000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    // NO refetchInterval - prevents RPC spam
  });
};

/**
 * Fetch voting power
 * No auto-refresh - prevents RPC spam
 * @param address Wallet address
 */
export const useVotingPower = (address?: string) => {
  const { getVotingPower } = useGovernance();

  return useQuery({
    queryKey: ['governance', 'votingPower', address],
    queryFn: async () => {
      if (!address) return null;
      return await getVotingPower(address);
    },
    enabled: !!address,
    staleTime: 300_000, // 5 minutes cache - no auto-refresh
    gcTime: 600_000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    // NO refetchInterval - prevents RPC spam
  });
};

/**
 * Prefetch all papers data for faster navigation
 * Call this when user hovers over links or on app mount
 */
export const prefetchAllPapers = async () => {
  // This will be called by the app to preload data
  // Implementation can be added if needed
  return Promise.resolve();
};
