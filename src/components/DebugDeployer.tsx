import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi'; // Tambah usePublicClient
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { custom } from 'viem';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react";

export const DebugDeployer = () => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient(); 
  const [loading, setLoading] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState("");

  const deployCollection = async () => {
    if (!walletClient || !publicClient) return;
    
    setLoading(true);
    const toastId = toast.loading("Deploying JUDOL Collection...");

    try {
      const config: StoryConfig = {
        account: walletClient.account,
        transport: custom(walletClient),
        chainId: 1315, 
      };
      const client = StoryClient.newClient(config);

      toast.loading("Please sign transaction...", { id: toastId });
      
      const newCollection = await client.nftClient.createNFTCollection({
        name: "JUDOL Research Papers",
        symbol: "JUDOL",
        isPublicMinting: true,
        mintOpen: true,
        mintFeeRecipient: walletClient.account.address,
        contractURI: "https://example.com/contract-metadata", 
        txOptions: {} 
      });

      console.log("Tx Sent:", newCollection.txHash);
      toast.loading("Waiting for blockchain confirmation...", { id: toastId });

      if (newCollection.txHash) {
        const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: newCollection.txHash 
        });
        
        console.log("Receipt:", receipt);
        
        let addr = newCollection.spgNftContract;
        if (!addr) {
            console.log("Address not returned directly. Check logs.");
        }

        if (addr || receipt.status === 'success') {
            const finalAddr = addr || "CHECK_EXPLORER_LOGS"; 
            
            setDeployedAddress(finalAddr);
            toast.success("DEPLOY SUKSES!", { id: toastId });
            
            console.log(">>> COPY ADDRESS INI KE USESTORY.TS <<<");
            console.log(finalAddr);
            
            if (finalAddr !== "CHECK_EXPLORER_LOGS") {
                navigator.clipboard.writeText(finalAddr);
                toast.info("Address copied to clipboard!");
            } else {
                toast.warning("Check Console/Explorer for Address", { id: toastId });
            }
        }
      }

    } catch (e: any) {
      console.error(e);
      let msg = e.message || "Unknown Error";
      if (msg.includes("User rejected")) msg = "Transaction rejected";
      toast.error("Deploy Failed: " + msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-red-500 bg-red-50 rounded-lg my-4">
      <h3 className="font-bold text-red-700 mb-2">⚠️ DEV ZONE: Setup NFT Contract</h3>
      {!deployedAddress ? (
        <Button onClick={deployCollection} disabled={loading} variant="destructive">
          {loading ? <Loader2 className="animate-spin mr-2"/> : <Rocket className="mr-2"/>}
          Deploy JUDOL Collection
        </Button>
      ) : (
        <div className="bg-white p-3 rounded border overflow-hidden">
          <p className="text-xs text-muted-foreground">Collection Address:</p>
          <p className="font-mono font-bold text-green-600 break-all">{deployedAddress}</p>
          <p className="text-xs text-red-500 mt-2 font-bold">
            SEKARANG COPY ADDRESS INI DAN TEMPEL DI FILE useStory.ts!
          </p>
          {deployedAddress === "CHECK_EXPLORER_LOGS" && (
              <p className="text-xs text-orange-600 mt-1">
                  *Buka Console (F12) atau Explorer untuk lihat address di Logs.
              </p>
          )}
        </div>
      )}
    </div>
  );
};