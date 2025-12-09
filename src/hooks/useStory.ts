import { useWalletClient, usePublicClient } from 'wagmi';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { custom } from 'viem';
import { useState } from 'react';
import { toast } from 'sonner';

export const useStory = () => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isMinting, setIsMinting] = useState(false);
  const spgNftContract = import.meta.env.VITE_SPG_NFT_CONTRACT_ADDRESS as `0x${string}`;

if (!spgNftContract) {
  console.error("❌ VITE_SPG_NFT_CONTRACT_ADDRESS is missing in .env!");
}

  const mintIP = async (metadata: { title: string, ipfsHash: string }) => {
    if (!walletClient || !publicClient) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsMinting(true);
    // Toast ID biar bisa di-update statusnya
    const toastId = toast.loading("Initializing Story Protocol SDK...");

    try {
      // 1. Setup Client untuk Aeneid
      const config: StoryConfig = {
        account: walletClient.account,
        transport: custom(walletClient),
        chainId: 1315,
      };
      const client = StoryClient.newClient(config);

      toast.loading("Please sign the transaction in your wallet...", { id: toastId });

      const response = await client.ipAsset.mintAndRegisterIp({
        spgNftContract: spgNftContract, 
        ipMetadata: {
          ipMetadataURI: `ipfs://${metadata.ipfsHash}`,
          ipMetadataHash: `0x${'0'.repeat(64)}`,
          nftMetadataURI: `ipfs://${metadata.ipfsHash}`,
          nftMetadataHash: `0x${'0'.repeat(64)}`,
        },
        txOptions: {} 
      });

      console.log("Transaction Sent. Hash:", response.txHash);

      toast.loading("Minting in progress (Waiting for block confirmation)...", { id: toastId });

      if (response.txHash) {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: response.txHash 
        });

        console.log("Transaction Confirmed:", receipt);
        
        toast.success("IP Asset Successfully Minted!", { 
          id: toastId,
          description: `Tx Hash: ${response.txHash.slice(0, 10)}...` 
        });

        return { 
            success: true, 
            txHash: response.txHash, 
            ipId: response.ipId 
        };
      }

    } catch (error: any) {
      console.error("Minting Error:", error);
      
      let msg = error.message || "Unknown error";
      if (msg.includes("User rejected")) msg = "Transaction rejected by user";
      if (msg.includes("reverted")) msg = "Transaction reverted (Cek SPG NFT Contract Address)";

      toast.error("Minting Failed", { id: toastId, description: msg });
      return { success: false, error: msg };
    } finally {
      setIsMinting(false);
    }
  };

  return { mintIP, isMinting };
};