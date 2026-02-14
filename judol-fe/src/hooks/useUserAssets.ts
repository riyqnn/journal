import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { useContract } from './useContract';
import { PaperMetadata } from './useContract';

/**
 * Hook for fetching user-specific blockchain data
 * Provides user assets and individual asset details with caching
 */

/**
 * Fetch all assets owned by the connected wallet
 */
export const useUserAssets = () => {
  const { address } = useAccount();
  const { getAllPapers } = useContract();

  return useQuery({
    queryKey: ['userAssets', address],
    queryFn: async () => {
      if (!address) return [];

      // Fetch all papers (we'll filter by owner)
      const allPapers = await getAllPapers(0, 1000); // Large limit to get all user assets

      // Filter by owner
      const userPapers = allPapers.filter(paper =>
        paper.owner?.toLowerCase() === address.toLowerCase()
      );

      return userPapers;
    },
    enabled: !!address, // Only run if wallet connected
    staleTime: 60000, // 1 minute cache
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Fetch paper metadata by token ID with caching
 * @param tokenId Token ID to fetch
 */
export const useAssetById = (tokenId: string) => {
  const { getPaperMetadata } = useContract();

  return useQuery({
    queryKey: ['paper', 'metadata', tokenId],
    queryFn: () => getPaperMetadata(tokenId),
    enabled: !!tokenId && tokenId !== 'PENDING',
    staleTime: 300000, // 5 minutes cache - metadata doesn't change often
    gcTime: 600000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Fetch user statistics (total assets, verified count, etc.)
 */
export const useUserStats = () => {
  const { data: assets = [] } = useUserAssets();

  return {
    totalAssets: assets.length,
    verifiedAssets: assets.filter(a => a.status === 'Verified').length,
    draftAssets: assets.filter(a => a.status === 'Draft').length,
    dataPoolAssets: assets.filter(a => a.status === 'DataPool').length,
    isLoading: !assets, // Will be false once assets are loaded
  };
};
