import { useQuery } from "@tanstack/react-query";
import { useGovernance, Proposal, ProposalStatus } from "@/hooks/useGovernance";
import { useMemo } from "react";

/**
 * Fetch minimum quorum requirement from contract
 * This is the quorum percentage required for proposals to pass (in basis points)
 */
export const useMinQuorum = () => {
  const { getMinQuorum } = useGovernance();

  return useQuery({
    queryKey: ['governance', 'minQuorum'],
    queryFn: async () => {
      const minQuorumBps = await getMinQuorum();
      const quorumPercent = (minQuorumBps / 100); // Convert basis points to percentage
      return { minQuorumBps, quorumPercent };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - rarely changes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 3,
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch governance proposals with voting data
 * Uses event-based fetching to efficiently get proposals without ID scanning
 * Caching: 60 seconds to prevent excessive refetch
 */
export const useGovernanceProposals = (enableAutoRefresh = false) => {
  const { getAllProposals } = useGovernance();

  return useQuery({
    queryKey: ['governance', 'proposals'],
    queryFn: async () => {
      // Fetch ALL proposals using event-based approach
      const proposals = await getAllProposals();

      // Validate and sort proposals
      // IMPORTANT: Check for existence (p != null) not truthiness, because id can be 0n (BigInt zero)
      const validatedProposals = proposals
        .filter(p => p != null) // Filter out null/undefined, but keep id: 0n
        .sort((a, b) => Number(b.id) - Number(a.id)); // Sort by ID descending (newest first)

      return validatedProposals;
    },
    staleTime: 60_000, // 60 seconds - prevent excessive refetch
    gcTime: 300_000,
    retry: 1, // Only 1 retry to avoid spam
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    refetchInterval: enableAutoRefresh ? 60000 : false,
  });
};

/**
 * Fetch single proposal details with all voting data
 * Use this for individual proposal pages or when you need fresh data
 */
export const useProposalDetails = (proposalId: number | string) => {
  const { getProposal } = useGovernance();

  return useQuery({
    queryKey: ['governance', 'proposal', String(proposalId)],
    queryFn: async () => {
      const proposal = await getProposal(Number(proposalId));

      if (!proposal) {
        throw new Error(`Proposal #${proposalId} not found`);
      }

      return proposal;
    },
    enabled: !!proposalId && proposalId !== 'PENDING',
    staleTime: 60_000, // 1 minute cache - shorter for individual proposals
    gcTime: 300_000,
    retry: 3,
    refetchOnWindowFocus: false,
  });
};

/**
 * Calculate voting statistics for a proposal
 * Returns percentages and formatted data
 */
export const calculateVotingStats = (proposal: Proposal) => {
  // Vote percentage: (votesFor / totalVotes) * 100
  const votePercentage = proposal.totalVotes > 0n
    ? Number((proposal.votesFor * 100n) / proposal.totalVotes)
    : 0;

  // Quorum percentage: (totalVotes / requiredVotes) * 100
  const quorumPercentage = proposal.requiredVotes > 0n
    ? Number((proposal.totalVotes * 100n) / proposal.requiredVotes)
    : 0;

  // Time left calculation
  const timeLeft = proposal.endTime > 0n
    ? Math.max(0, Number(proposal.endTime) - Math.floor(Date.now() / 1000))
    : 0;

  const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60));
  const hoursLeft = Math.ceil(timeLeft / (60 * 60));

  // Format time left
  const getTimeLeftDisplay = (): string => {
    if (timeLeft <= 0) return "CLOSED";
    if (daysLeft > 0) return `${daysLeft} DAYS`;
    if (hoursLeft > 0) return `${hoursLeft} HOURS`;
    return "< 1 HOUR";
  };

  // Check if proposal is active
  // IMPORTANT: Convert to Number for comparison because proposal.status is BigInt from contract
  const isActive = Number(proposal.status) === ProposalStatus.Active;

  // Check if quorum reached
  const quorumReached = proposal.totalVotes >= proposal.requiredVotes;

  return {
    votePercentage: Math.min(votePercentage, 100),
    quorumPercentage: Math.min(quorumPercentage, 100),
    timeLeft,
    daysLeft,
    hoursLeft,
    timeLeftDisplay: getTimeLeftDisplay(),
    isActive,
    quorumReached,
    votesFor: Number(proposal.votesFor),
    votesAgainst: Number(proposal.votesAgainst),
    totalVotes: Number(proposal.totalVotes),
    requiredVotes: Number(proposal.requiredVotes),
  };
};

/**
 * Get all active proposals only
 * Useful for dashboard or highlighting active governance items
 */
export const useActiveProposals = () => {
  const { data: proposals = [], isLoading } = useGovernanceProposals();

  return useQuery({
    queryKey: ['governance', 'activeProposals'],
    queryFn: () => {
      return proposals.filter(p => p.status === ProposalStatus.Active);
    },
    enabled: proposals.length > 0,
    staleTime: 60_000, // 1 minute cache
    gcTime: 300_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
