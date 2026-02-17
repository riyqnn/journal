import { useWalletClient, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
// Import full compiled ABI
import ResearchPaperNFTABI from '@/contracts/abis/ResearchPaperNFT.json';

// Extract ABI from JSON
const RESEARCH_PAPER_NFT_ABI = ResearchPaperNFTABI.abi;

const CONTRACT_ADDRESS = import.meta.env.VITE_RESEARCH_PAPER_NFT_ADDRESS as `0x${string}`;

if (!CONTRACT_ADDRESS) {
  console.error("❌ VITE_RESEARCH_PAPER_NFT_ADDRESS is missing in .env!");
}

// Get RPC URL from ENV
const getRpcUrl = () => import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

// Paper status enum from contract
export enum PaperStatus {
  Draft = 0,
  Verified = 1,
  Rejected = 2,
  DataPool = 3,
}

export interface PaperMetadata {
  tokenId: string;
  title: string;
  author: string;
  affiliation: string;
  ipfsHash: string;
  status: string;
  mintedAt: string;
  // Additional fields for frontend
  owner?: string;
}

/**
 * Hook for interacting with the ResearchPaperNFT smart contract
 * @notice Handles minting, querying, and updating research paper NFTs on Arbitrum Sepolia
 */
export const useContract = () => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isMinting, setIsMinting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create provider for read operations
  const getProvider = () => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  };

  /**
   * Mint a new research paper NFT
   * @param metadata Paper metadata including title, author, affiliation, and IPFS hash
   * @returns Object with success status, transaction hash, and token ID
   */
  const mintPaper = async (metadata: {
    title: string;
    author: string;
    affiliation: string;
    ipfsHash: string;
  }) => {
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!CONTRACT_ADDRESS) {
      return { success: false, error: "Contract address not configured. Please set VITE_RESEARCH_PAPER_NFT_ADDRESS in your .env file" };
    }

    setIsMinting(true);
    const toastId = toast.loading("Minting on Arbitrum Sepolia...");

    try {
      // Create ethers provider and signer from viem wallet client
      // @ts-ignore - viem wallet client is compatible with ethers BrowserProvider
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RESEARCH_PAPER_NFT_ABI, signer);

      // Call mintPaper function
      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.mintPaper(
        await signer.getAddress(),
        metadata.ipfsHash,
        metadata.title,
        metadata.author,
        metadata.affiliation
      );

      toast.loading("Confirming transaction...", { id: toastId });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Extract tokenId from logs
      let tokenId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const iface = new ethers.Interface(RESEARCH_PAPER_NFT_ABI);
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
              if (parsed && parsed.name === 'PaperMinted') {
                tokenId = parsed.args.tokenId.toString();
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

      toast.success("Research Paper Minted Successfully!", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return {
        success: true,
        txHash: tx.hash,
        tokenId: tokenId,
        ipId: `IP-${tokenId || 'PENDING'}` // Format IP ID
      };

    } catch (error: any) {
      console.error("Minting Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("insufficient funds")) msg = "Insufficient funds for gas";
      if (msg.includes("network")) msg = "Network error - please try again";

      toast.error("Minting Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsMinting(false);
    }
  };

  /**
   * Get paper metadata from the blockchain
   * @param tokenId The ID of the token to query
   * @returns Paper metadata object
   */
  const getPaperMetadata = async (tokenId: string) => {
    if (!CONTRACT_ADDRESS) {
      return null;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RESEARCH_PAPER_NFT_ABI, provider);

      const metadata = await contract.getPaperMetadata(tokenId);
      return {
        title: metadata[0],
        author: metadata[1],
        affiliation: metadata[2],
        ipfsHash: metadata[3],
        status: ['Draft', 'Verified', 'Rejected', 'DataPool'][metadata[4]],
        mintedAt: new Date(Number(metadata[5]) * 1000).toISOString()
      };
    } catch (error) {
      console.error("Error fetching paper metadata:", error);
      return null;
    }
  };

  /**
   * Get total supply of minted papers
   * @returns Total number of papers minted
   */
  const getTotalSupply = async () => {
    if (!CONTRACT_ADDRESS) {
      return 0;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RESEARCH_PAPER_NFT_ABI, provider);

      const supply = await contract.totalSupply();
      return Number(supply);
    } catch (error) {
      console.error("Error fetching total supply:", error);
      return 0;
    }
  };

  /**
   * Get all papers with optional pagination
   * @param offset Starting index
   * @param limit Maximum number of papers to fetch
   * @returns Array of paper metadata
   */
  const getAllPapers = async (offset: number = 0, limit: number = 20): Promise<PaperMetadata[]> => {
    if (!CONTRACT_ADDRESS) {
      return [];
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RESEARCH_PAPER_NFT_ABI, provider);

      const totalSupply = await contract.totalSupply();

      // Fix: Properly implement pagination with offset
      const endIndex = Math.min(offset + limit, Number(totalSupply));

      if (offset >= endIndex) return [];

      const papers: PaperMetadata[] = [];

      // Batch fetch papers in chunks to avoid RPC rate limits
      const BATCH_SIZE = 10;
      for (let batchStart = offset; batchStart < endIndex; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, endIndex);
        const batchPromises = [];

        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push(fetchPaperData(contract, i.toString()));
        }

        const batchResults = await Promise.all(batchPromises);
        for (const result of batchResults) {
          if (result) papers.push(result);
        }

        // Small delay between batches to avoid rate limiting
        if (batchStart + BATCH_SIZE < endIndex) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return papers;
    } catch (error) {
      console.error("Error fetching all papers:", error);
      return [];
    }
  };

  /**
   * Helper function to fetch paper data
   */
  const fetchPaperData = async (contract: any, tokenId: string): Promise<PaperMetadata | null> => {
    try {
      const metadata = await contract.getPaperMetadata(tokenId);
      const owner = await contract.ownerOf(tokenId);

      return {
        tokenId,
        title: metadata[0],
        author: metadata[1],
        affiliation: metadata[2],
        ipfsHash: metadata[3],
        status: ['Draft', 'Verified', 'Rejected', 'DataPool'][metadata[4]],
        mintedAt: new Date(Number(metadata[5]) * 1000).toISOString(),
        owner,
      };
    } catch (error) {
      // Log error but return null (paper might not exist yet)
      console.error(`Error fetching paper ${tokenId}:`, error);
      return null;
    }
  };

  /**
   * Get papers by status filter
   * @param status Status to filter by
   * @returns Array of papers with the specified status
   */
  const getPapersByStatus = async (status: PaperStatus): Promise<PaperMetadata[]> => {
    const allPapers = await getAllPapers();
    const statusMap = ['Draft', 'Verified', 'Rejected', 'DataPool'];
    return allPapers.filter(p => p.status === statusMap[status]);
  };

  /**
   * Update paper status (admin only)
   * @param tokenId Token ID of the paper
   * @param newStatus New status to set
   * @returns Transaction result
   */
  const updatePaperStatus = async (tokenId: string, newStatus: PaperStatus) => {
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!CONTRACT_ADDRESS) {
      return { success: false, error: "Contract address not configured" };
    }

    setIsUpdating(true);
    const toastId = toast.loading("Updating paper status...");

    try {
      // @ts-ignore
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RESEARCH_PAPER_NFT_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.updateStatus(tokenId, newStatus);
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success("Paper status updated!", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Status Update Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("Ownable")) msg = "Only contract owner can update status";

      toast.error("Update Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Watch for paper events (PaperMinted, StatusUpdated)
   * NOTE: Event listeners not supported on Arbitrum Sepolia RPC (eth_newFilter error)
   * This function is disabled to prevent RPC spam
   * Use React Query refetchOnMount or manual refetch instead
   * @param callback Function to call when events occur (currently unused)
   * @returns Unsubscribe function (no-op)
   */
  const watchPaperEvents = (callback: (event: { type: string; data: any }) => void) => {
    // Event listeners using eth_newFilter are not supported on Arbitrum Sepolia
    // This returns a no-op function to prevent errors and RPC spam
    return () => {}; // No-op unsubscribe function
  };

  /**
   * Get AI trust score from IPFS metadata
   * @param ipfsHash IPFS hash of the metadata JSON
   * @returns AI score (0-100) or null if not found
   */
  const getPaperAIScore = async (ipfsHash: string): Promise<number | null> => {
    if (!ipfsHash) return null;

    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      if (!response.ok) return null;
      const metadata = await response.json();
      const aiCertaintyAttr = metadata.attributes?.find((a: any) => a.trait_type === "AICertainty");
      if (aiCertaintyAttr?.value) {
        return parseInt(aiCertaintyAttr.value.replace("%", ""));
      }
      return null;
    } catch (error) {
      console.error("Error fetching AI score:", error);
      return null;
    }
  };

  return {
    mintPaper,
    isMinting,
    getPaperMetadata,
    getTotalSupply,
    getAllPapers,
    getPapersByStatus,
    updatePaperStatus,
    isUpdating,
    watchPaperEvents,
    getPaperAIScore,
    contractAddress: CONTRACT_ADDRESS
  };
};
