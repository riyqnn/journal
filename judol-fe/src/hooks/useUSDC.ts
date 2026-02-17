import { useWalletClient } from 'wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import MockUSDCABI from '@/contracts/abis/MockUSDC.json';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;

if (!USDC_ADDRESS) {
  console.error("❌ VITE_USDC_ADDRESS is missing in .env!");
}

const USDC_ABI = MockUSDCABI.abi;

// Get RPC URL from ENV
const getRpcUrl = () => import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

/**
 * Hook for interacting with Mock USDC token contract
 */
export const useUSDC = () => {
  const { data: walletClient } = useWalletClient();
  const [isTransferring, setIsTransferring] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Create provider for read operations
  const getProvider = () => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  };

  /**
   * Get USDC balance of an address
   */
  const getBalance = async (address: string): Promise<bigint> => {
    if (!USDC_ADDRESS) {
      return 0n;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

      const balance = await contract.balanceOf(address);
      return balance;
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      return 0n;
    }
  };

  /**
   * Transfer USDC to another address
   */
  const transfer = async (to: string, amount: bigint) => {
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!USDC_ADDRESS) {
      return { success: false, error: "USDC contract not configured" };
    }

    setIsTransferring(true);
    const toastId = toast.loading("Transferring USDC...");

    try {
      // @ts-ignore - viem wallet client is compatible with ethers BrowserProvider
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.transfer(to, amount);
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success("Transfer successful!", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Transfer Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("insufficient")) msg = "Insufficient USDC balance";

      toast.error("Transfer Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsTransferring(false);
    }
  };

  /**
   * Mint new USDC tokens (only callable by contract owner/minter)
   * Note: This is for testing purposes only
   */
  const mint = async (to: string, amount: bigint) => {
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    if (!USDC_ADDRESS) {
      return { success: false, error: "USDC contract not configured" };
    }

    setIsMinting(true);
    const toastId = toast.loading("Minting USDC...");

    try {
      // @ts-ignore
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const tx = await contract.mint(to, amount);
      toast.loading("Confirming transaction...", { id: toastId });

      await tx.wait();

      toast.success("Mint successful!", {
        id: toastId,
        description: `Tx Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Mint Error:", error);

      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";

      toast.error("Mint Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsMinting(false);
    }
  };

  /**
   * Get total supply of USDC
   */
  const getTotalSupply = async (): Promise<bigint> => {
    if (!USDC_ADDRESS) {
      return 0n;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

      const supply = await contract.totalSupply();
      return supply;
    } catch (error) {
      console.error("Error fetching total supply:", error);
      return 0n;
    }
  };

  /**
   * Get token info
   */
  const getTokenInfo = async () => {
    if (!USDC_ADDRESS) {
      return { name: "", symbol: "", decimals: 0, totalSupply: 0n };
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      return { name, symbol, decimals, totalSupply };
    } catch (error) {
      console.error("Error fetching token info:", error);
      return { name: "", symbol: "", decimals: 6, totalSupply: 0n };
    }
  };

  return {
    getBalance,
    transfer,
    isTransferring,
    mint,
    isMinting,
    getTotalSupply,
    getTokenInfo,
    contractAddress: USDC_ADDRESS,
  };
};
