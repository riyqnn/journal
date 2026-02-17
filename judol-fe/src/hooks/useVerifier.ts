import { useWalletClient } from 'wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import VerifierRegistryABI from '@/contracts/abis/VerifierRegistry.json';

const VERIFIER_REGISTRY_ADDRESS = import.meta.env.VITE_VERIFIER_REGISTRY_ADDRESS as `0x${string}`;

if (!VERIFIER_REGISTRY_ADDRESS) {
  console.error("❌ VITE_VERIFIER_REGISTRY_ADDRESS is missing in .env!");
}

// Extract ABI
const VERIFIER_REGISTRY_ABI = VerifierRegistryABI.abi;

// Get RPC URL from ENV
const getRpcUrl = () => import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

// Verifier tiers matching the contract
export enum VerifierTier {
  Bronze = 0,
  Silver = 1,
  Gold = 2,
  Platinum = 3,
}

export interface VerifierStats {
  tier: VerifierTier;
  totalVerifications: bigint;
  correctVerifications: bigint;
  rewardsEarned: bigint;
}

export interface Verification {
  verifier: string;
  tokenId: bigint;
  approved: boolean;
  comment: string;
  timestamp: bigint;
  rewardClaimed: boolean;
}

/**
 * Hook for interacting with VerifierRegistry contract
 */
export const useVerifier = () => {
  const { data: walletClient } = useWalletClient();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Create provider for read operations
  const getProvider = () => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  };

  /**
   * Register as a verifier
   */
  const registerVerifier = async () => {
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!VERIFIER_REGISTRY_ADDRESS) {
      return { success: false, error: "Verifier Registry contract not configured" };
    }

    setIsRegistering(true);
    const toastId = toast.loading("Registering as verifier...");

    try {
      // @ts-ignore - viem wallet client is compatible with ethers BrowserProvider
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.registerVerifier();
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success("Successfully registered as verifier!", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Registration Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("Already registered")) msg = "You are already registered as a verifier";

      toast.error("Registration Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Verify a paper
   */
  const verifyPaper = async (tokenId: string, approved: boolean, comment: string) => {
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!VERIFIER_REGISTRY_ADDRESS) {
      return { success: false, error: "Verifier Registry contract not configured" };
    }

    setIsVerifying(true);
    const toastId = toast.loading(approved ? "Approving paper..." : "Rejecting paper...");

    try {
      // @ts-ignore
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.verifyPaper(tokenId, approved, comment);
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success(approved ? "Paper approved!" : "Paper rejected!", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Verification Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("Not registered")) msg = "You must register as a verifier first";
      if (msg.includes("Already verified")) msg = "You have already verified this paper";

      toast.error("Verification Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Claim verification reward (50 USDC)
   */
  const claimReward = async (tokenId: string) => {
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!VERIFIER_REGISTRY_ADDRESS) {
      return { success: false, error: "Verifier Registry contract not configured" };
    }

    setIsClaiming(true);
    const toastId = toast.loading("Claiming reward...");

    try {
      // @ts-ignore
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.claimReward(tokenId);
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success("Reward claimed! +50 USDC", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Claim Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("No unclaimed")) msg = "No reward available for this paper";
      if (msg.includes("Transfer failed")) msg = "Insufficient USDC in reward pool";

      toast.error("Claim Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsClaiming(false);
    }
  };

  /**
   * Get verifier stats
   */
  const getVerifierStats = async (address: string): Promise<VerifierStats | null> => {
    if (!VERIFIER_REGISTRY_ADDRESS) {
      return null;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, provider);

      const stats = await contract.getVerifierStats(address);
      return {
        tier: stats[0],
        totalVerifications: stats[1],
        correctVerifications: stats[2],
        rewardsEarned: stats[3],
      };
    } catch (error) {
      console.error("Error fetching verifier stats:", error);
      return null;
    }
  };

  /**
   * Check if address is a registered verifier
   */
  const isVerifier = async (address: string): Promise<boolean> => {
    if (!VERIFIER_REGISTRY_ADDRESS) {
      return false;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, provider);

      const isRegistered = await contract.isVerifier(address);
      return isRegistered;
    } catch (error) {
      console.error("Error checking verifier status:", error);
      return false;
    }
  };

  /**
   * Get all verifications for a paper
   */
  const getPaperVerifications = async (tokenId: string): Promise<Verification[]> => {
    if (!VERIFIER_REGISTRY_ADDRESS) {
      return [];
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, provider);

      const verifications = await contract.getPaperVerifications(tokenId);
      return verifications.map((v: any) => ({
        verifier: v.verifier,
        tokenId: v.tokenId,
        approved: v.approved,
        comment: v.comment,
        timestamp: v.timestamp,
        rewardClaimed: v.rewardClaimed,
      }));
    } catch (error) {
      console.error("Error fetching paper verifications:", error);
      return [];
    }
  };

  /**
   * Get number of verifications for a paper
   */
  const getVerificationCount = async (tokenId: string): Promise<number> => {
    if (!VERIFIER_REGISTRY_ADDRESS) {
      return 0;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, provider);

      const count = await contract.getVerificationCount(tokenId);
      return Number(count);
    } catch (error) {
      console.error("Error fetching verification count:", error);
      return 0;
    }
  };

  /**
   * Get all registered verifiers
   */
  const getAllVerifiers = async (): Promise<string[]> => {
    if (!VERIFIER_REGISTRY_ADDRESS) {
      return [];
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_REGISTRY_ABI, provider);

      const verifiers = await contract.getAllVerifiers();
      return verifiers;
    } catch (error) {
      console.error("Error fetching all verifiers:", error);
      return [];
    }
  };

  return {
    registerVerifier,
    isRegistering,
    verifyPaper,
    isVerifying,
    claimReward,
    isClaiming,
    getVerifierStats,
    isVerifier,
    getPaperVerifications,
    getVerificationCount,
    getAllVerifiers,
    contractAddress: VERIFIER_REGISTRY_ADDRESS,
  };
};
