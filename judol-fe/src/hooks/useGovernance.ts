import { useWalletClient } from 'wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import GovernanceDAOABI from '@/contracts/abis/GovernanceDAO.json';

const GOVERNANCE_DAO_ADDRESS = import.meta.env.VITE_GOVERNANCE_DAO_ADDRESS as `0x${string}`;

if (!GOVERNANCE_DAO_ADDRESS) {
  console.error("❌ VITE_GOVERNANCE_DAO_ADDRESS is missing in .env!");
}

// Extract ABI
const GOVERNANCE_DAO_ABI = GovernanceDAOABI.abi;

// Get RPC URL from config
const getRpcUrl = () => {
  return import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
};

// Proposal types matching the contract
export enum ProposalType {
  Journal = 0,
  Reviewer = 1,
  Treasury = 2,
  Policy = 3,
}

export enum ProposalStatus {
  Active = 0,
  Passed = 1,
  Rejected = 2,
  Executed = 3,
}

export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  proposalType: ProposalType;
  status: ProposalStatus;
  votesFor: bigint;
  votesAgainst: bigint;
  totalVotes: bigint;
  proposer: string;
  startTime: bigint;
  endTime: bigint;
  requiredVotes: bigint;
}

/**
 * Hook for interacting with GovernanceDAO contract
 */
export const useGovernance = () => {
  const { data: walletClient } = useWalletClient();
  const [isVoting, setIsVoting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Create provider for read operations
  const getProvider = () => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  };

  /**
   * Get all active proposals
   */
  const getActiveProposals = async (): Promise<number[]> => {
    if (!GOVERNANCE_DAO_ADDRESS) {
      return [];
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(GOVERNANCE_DAO_ADDRESS, GOVERNANCE_DAO_ABI, provider);

      const proposalIds = await contract.getActiveProposals();
      return proposalIds.map((id: bigint) => Number(id));
    } catch (error) {
      console.error("Error fetching active proposals:", error);
      return [];
    }
  };

  /**
   * Get total proposal count and fetch all proposals
   */
  const getAllProposals = async (): Promise<Proposal[]> => {
    if (!GOVERNANCE_DAO_ADDRESS) {
      return [];
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(GOVERNANCE_DAO_ADDRESS, GOVERNANCE_DAO_ABI, provider);

      // First, try to get the actual proposal count
      let maxId = 20; // Default max to check (increase if you have more proposals)
      try {
        // Try to get proposal count from contract
        const countResult = await contract.proposalCount();
        maxId = Number(countResult);
        console.log("Proposal count from contract:", maxId);
      } catch (e) {
        // If proposalCount() doesn't exist, scan for proposals
        console.log("Scanning for proposals up to ID 20...");
      }

      // Proposal IDs typically start from 1 (not 0)
      // Only try to fetch from 1 to maxId
      const proposalIds = Array.from({ length: maxId }, (_, i) => i + 1);

      const proposals = await Promise.all(
        proposalIds.map(id => getProposal(id))
      );

      const validProposals = proposals.filter((p): p is Proposal => p !== null);
      console.log("Found", validProposals.length, "valid proposals out of", maxId, "checked");

      return validProposals;
    } catch (error) {
      console.error("Error fetching all proposals:", error);
      return [];
    }
  };

  /**
   * Get proposal details
   */
  const getProposal = async (proposalId: number): Promise<Proposal | null> => {
    if (!GOVERNANCE_DAO_ADDRESS) {
      return null;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(GOVERNANCE_DAO_ADDRESS, GOVERNANCE_DAO_ABI, provider);

      const proposal = await contract.getProposal(proposalId);
      return {
        id: proposal[0],
        title: proposal[1],
        description: proposal[2],
        proposalType: proposal[3],
        status: proposal[4],
        votesFor: proposal[5],
        votesAgainst: proposal[6],
        totalVotes: proposal[7],
        proposer: proposal[8],
        startTime: proposal[9],
        endTime: proposal[10],
        requiredVotes: proposal[11],
      };
    } catch (error) {
      // Silently fail for non-existent proposals
      return null;
    }
  };

  /**
   * Get multiple proposals
   */
  const getProposals = async (proposalIds: number[]): Promise<Proposal[]> => {
    const proposals = await Promise.all(
      proposalIds.map(id => getProposal(id))
    );
    return proposals.filter((p): p is Proposal => p !== null);
  };

  /**
   * Vote on a proposal
   */
  const vote = async (proposalId: number, support: boolean) => {
    if (!walletClient) {
      toast.error("Wallet not connected!");
      return { success: false };
    }

    if (!GOVERNANCE_DAO_ADDRESS) {
      toast.error("Governance contract not configured!");
      return { success: false };
    }

    setIsVoting(true);
    const toastId = toast.loading("Submitting vote...");

    try {
      // @ts-ignore - viem wallet client is compatible with ethers BrowserProvider
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(GOVERNANCE_DAO_ADDRESS, GOVERNANCE_DAO_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.vote(proposalId, support);
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success("Vote submitted successfully!", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Voting Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("Already voted")) msg = "You have already voted on this proposal";
      if (msg.includes("not active")) msg = "Proposal is no longer active";

      toast.error("Voting Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsVoting(false);
    }
  };

  /**
   * Create a new proposal
   */
  const createProposal = async (
    title: string,
    description: string,
    proposalType: ProposalType,
    votingPeriodSeconds: number = 7 * 24 * 60 * 60 // Default 7 days
  ) => {
    if (!walletClient) {
      toast.error("Wallet not connected!");
      return { success: false };
    }

    if (!GOVERNANCE_DAO_ADDRESS) {
      toast.error("Governance contract not configured!");
      return { success: false };
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating proposal...");

    try {
      // @ts-ignore
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(GOVERNANCE_DAO_ADDRESS, GOVERNANCE_DAO_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.createProposal(title, description, proposalType, votingPeriodSeconds);
      toast.loading("Confirming transaction...", { id: toastId });

      const receipt = await tx.wait();

      // Get proposal ID from event logs
      let proposalId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const iface = new ethers.Interface(GOVERNANCE_DAO_ABI);
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
              if (parsed && parsed.name === 'ProposalCreated') {
                proposalId = parsed.args.proposalId.toString();
                break;
              }
            } catch (e) {
              // Skip logs that don't match our interface
            }
          }
        } catch (e) {
          console.error("Error parsing logs:", e);
        }
      }

      toast.success("Proposal created successfully!", {
        id: toastId,
        description: `Proposal ID: ${proposalId || 'N/A'}`
      });

      return { success: true, txHash: tx.hash, proposalId };
    } catch (error: any) {
      console.error("Proposal Creation Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";

      toast.error("Proposal Creation Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Execute a passed proposal
   */
  const executeProposal = async (proposalId: number) => {
    if (!walletClient) {
      toast.error("Wallet not connected!");
      return { success: false };
    }

    const toastId = toast.loading("Executing proposal...");

    try {
      // @ts-ignore
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(GOVERNANCE_DAO_ADDRESS, GOVERNANCE_DAO_ABI, signer);

      const tx = await contract.executeProposal(proposalId);
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success("Proposal executed!", { id: toastId });
      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Execution Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";

      toast.error("Execution Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    }
  };

  /**
   * Get user's voting power (USDC balance)
   * Falls back to direct USDC balance if governance contract function fails
   */
  const getVotingPower = async (address: string): Promise<bigint> => {
    if (!address) {
      return 0n;
    }

    try {
      // First try: Get from governance contract
      try {
        const provider = getProvider();
        const contract = new ethers.Contract(GOVERNANCE_DAO_ADDRESS, GOVERNANCE_DAO_ABI, provider);
        const power = await contract.getVotingPower(address);
        console.log("Voting power from governance contract:", power.toString());
        return power;
      } catch (e) {
        // Second try: Get directly from USDC contract
        console.log("Governance contract getVotingPower failed, using USDC balance directly");
        const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
        if (!USDC_ADDRESS) return 0n;

        const provider = getProvider();
        const usdcAbi = [
          "function balanceOf(address owner) view returns (uint256)"
        ];
        const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
        const balance = await usdcContract.balanceOf(address);
        console.log("USDC balance:", balance.toString());
        return balance;
      }
    } catch (error) {
      console.error("Error fetching voting power:", error);
      return 0n;
    }
  };

  return {
    getActiveProposals,
    getAllProposals,
    getProposal,
    getProposals,
    vote,
    isVoting,
    createProposal,
    isCreating,
    executeProposal,
    getVotingPower,
    contractAddress: GOVERNANCE_DAO_ADDRESS,
  };
};
