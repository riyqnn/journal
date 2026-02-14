import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, ShieldCheck, FileText, Globe, ExternalLink, Copy, CheckCircle2, Clock, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useAssetById } from "@/hooks/useUserAssets";
import { useAccount } from "wagmi";
import { PRICING } from "@/config/pricing";

export default function AssetDetailPage() {
    const { id } = useParams();
    const { address } = useAccount();
    const { data: asset, isLoading, error } = useAssetById(id || '');

    // --- 1. FETCH IPFS METADATA ---
    const [displayAsset, setDisplayAsset] = useState<any>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (!asset) {
                setDisplayAsset(null);
                return;
            }

            setMetadataLoading(true);
            try {
                // Try to fetch IPFS metadata
                let finalAbstract = asset.abstract || "Abstract not available.";
                let finalAuthorName = asset.author || "Unknown Researcher";

                if (asset.ipfsHash) {
                    try {
                        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${asset.ipfsHash}`);
                        if (response.ok) {
                            const metadata = await response.json();
                            if (metadata.description) finalAbstract = metadata.description;

                            const authorAttr = metadata.attributes?.find((attr: any) => attr.trait_type === "Author");
                            if (authorAttr) finalAuthorName = authorAttr.value;
                        }
                    } catch (error) {
                        console.error("Failed to fetch IPFS metadata:", error);
                    }
                }

                // Determine if verified
                const isVerified = asset.status === 'Verified';
                const displayAbstract = isVerified
                    ? finalAbstract
                    : "This asset is currently under review. The full content is encrypted on IPFS pending commercial license verification.";

                setDisplayAsset({
                    ...asset,
                    author: {
                        name: finalAuthorName,
                        org: asset.affiliation || "Unknown Institution",
                        wallet: asset.owner ? `${asset.owner.slice(0, 6)}...${asset.owner.slice(-4)}` : "0x71C...9A21",
                        sinta: 2
                    },
                    abstract: displayAbstract,
                    licenseType: "Commercial (PIL)",
                    price: isVerified ? PRICING.getVerifiedPrice() : "To be determined",
                    pdfUrl: `https://gateway.pinata.cloud/ipfs/${asset.ipfsHash}`,
                    txHash: "0x...", // Would need to fetch from contract events
                });
            } catch (error) {
                console.error("Error processing metadata:", error);
                setDisplayAsset(asset);
            } finally {
                setMetadataLoading(false);
            }
        };

        fetchMetadata();
    }, [asset]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handlePurchase = () => {
        if (displayAsset?.pdfUrl) {
            window.open(displayAsset.pdfUrl, '_blank');
            toast.success("File Downloaded", { description: "Decryption key applied successfully." });
        } else {
            toast.error("File Not Available");
        }
    };

    if (isLoading || metadataLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center font-mono">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="text-2xl font-bold uppercase">Loading Asset Data...</p>
            <p className="text-sm text-neutral-500 mt-2">Fetching from Arbitrum Sepolia</p>
        </div>
    );

    if (error || !displayAsset) return (
        <div className="min-h-screen flex flex-col items-center justify-center font-mono">
            <p className="text-2xl font-bold uppercase text-red-500">Asset Not Found</p>
            <p className="text-sm text-neutral-500 mt-2">The requested asset could not be loaded from the blockchain</p>
            <Link to="/explore" className="mt-6 px-6 py-3 bg-black text-white border-2 border-black rounded-none font-bold hover:bg-white hover:text-black transition-all">
                Back to Explore
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-20 pt-8 font-sans selection:bg-yellow-300 selection:text-black relative">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                
                {/* BACK BUTTON */}
                <Link to="/explore" className="inline-flex items-center text-sm font-bold uppercase mb-8 hover:bg-black hover:text-white px-3 py-2 border-2 border-transparent hover:border-black transition-all">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explore
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- LEFT COLUMN: CONTENT --- */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Header Info */}
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="outline" className="bg-white text-black border-2 border-black rounded-none px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
                                    {asset.type || "RESEARCH PAPER"}
                                </Badge>
                                {asset.status === 'verified' ? (
                                    <Badge variant="outline" className="bg-[#0065D1] text-white border-2 border-black rounded-none px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
                                        <ShieldCheck className="w-4 h-4 mr-2" /> VERIFIED SINTA
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-300 text-black border-2 border-black rounded-none px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
                                        <Clock className="w-4 h-4 mr-2" /> PENDING REVIEW
                                    </Badge>
                                )}
                                <Badge className="bg-black text-white border-2 border-black rounded-none px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(128,128,128,0.5)] text-sm">
                                    {asset.licenseType.toUpperCase()}
                                </Badge>
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl font-black uppercase leading-tight text-black tracking-tighter">
                                {asset.title}
                            </h1>
                            
                            <div className="flex items-center gap-4 py-4 border-y-2 border-black border-dashed">
                                <Avatar className="h-12 w-12 border-2 border-black rounded-none bg-pink-200">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${asset.author.name}`} />
                                    <AvatarFallback className="font-bold text-black">AU</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-black text-lg uppercase">{asset.author.name}</div>
                                    <div className="text-xs font-mono font-bold text-neutral-500 bg-neutral-100 inline-block px-1 border border-neutral-300">
                                        {asset.author.org}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Abstract Card */}
                        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neutral-100 border-b-2 border-black p-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                <h3 className="font-black uppercase text-lg">Abstract</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-base font-medium leading-relaxed font-mono">
                                    "{asset.abstract}"
                                </p>
                            </div>
                        </div>

                        {/* Tabs: Content Detail */}
                        <Tabs defaultValue="preview" className="w-full">
                            <TabsList className="w-full justify-start border-b-2 border-black rounded-none h-auto p-0 bg-transparent gap-0">
                                <TabsTrigger 
                                    value="preview" 
                                    className="
                                        rounded-none border-r-2 border-black border-t-2 border-l-2 bg-neutral-200 px-6 py-3 font-bold uppercase text-black
                                        data-[state=active]:bg-yellow-300 data-[state=active]:translate-y-[2px] data-[state=active]:border-b-0
                                        hover:bg-white transition-all
                                    "
                                >
                                    PDF Preview
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="history" 
                                    className="
                                        rounded-none border-r-2 border-black border-t-2 bg-neutral-200 px-6 py-3 font-bold uppercase text-black
                                        data-[state=active]:bg-yellow-300 data-[state=active]:translate-y-[2px] data-[state=active]:border-b-0
                                        hover:bg-white transition-all
                                    "
                                >
                                    Provenance History
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="preview" className="pt-0 border-2 border-black border-t-0 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-[-2px]">
                                {asset.status === 'verified' ? (
                                    <div className="space-y-6">
                                        <div className="w-full h-[600px] border-2 border-black bg-neutral-100 relative">
                                            {/* Grid overlay for 'technical' feel */}
                                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-10" />
                                            <iframe src={asset.pdfUrl} className="w-full h-full relative z-0" title="PDF Preview" />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button onClick={handlePurchase} className="h-12 px-8 bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase">
                                                <Download className="w-5 h-5 mr-2" /> Download Signed PDF
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] bg-neutral-100 border-2 border-black border-dashed flex flex-col items-center justify-center text-center p-8">
                                        <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                                            <Lock className="h-12 w-12 text-black" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase mb-2">Content Locked</h3>
                                        <p className="font-bold text-neutral-500 max-w-sm mb-8 font-mono">
                                            This asset is currently under peer review. Content will be decrypted once verified by Expert Nodes.
                                        </p>
                                        <Button disabled className="h-12 px-8 bg-neutral-300 text-neutral-500 border-2 border-neutral-400 rounded-none font-bold cursor-not-allowed">
                                            <Clock className="w-5 h-5 mr-2" /> AWAITING VERIFICATION
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="history" className="pt-0 border-2 border-black border-t-0 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-[-2px]">
                                <div className="space-y-6">
                                    {asset.status === 'verified' && (
                                        <div className="flex gap-4 items-start border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                                            <div className="mt-1 bg-green-500 border-2 border-black p-1 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <CheckCircle2 className="w-4 h-4"/>
                                            </div>
                                            <div>
                                                <p className="font-black uppercase text-sm">Verified by Reviewer (You)</p>
                                                <p className="text-xs font-bold text-neutral-600 font-mono">Status upgraded to Commercial License</p>
                                                <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase">Just now</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-4 items-start border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                                        <div className="mt-1 bg-blue-500 border-2 border-black p-1 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <Globe className="w-4 h-4"/>
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-sm">Minted on Arbitrum Sepolia</p>
                                            <p className="text-xs font-bold text-neutral-600 font-mono">Initial IP Registration (Unverified)</p>
                                            <p
                                                className="text-[10px] font-bold text-black mt-1 cursor-pointer hover:bg-black hover:text-white inline-block px-1 transition-colors"
                                                onClick={() => window.open(`https://sepolia.arbiscan.io/tx/${asset.txHash}`, '_blank')}
                                            >
                                                TX: {asset.txHash ? `${asset.txHash.slice(0, 10)}...` : "0x..."} <ExternalLink className="inline h-3 w-3"/>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* --- RIGHT COLUMN: WEB3 INFO --- */}
                    <div className="space-y-8">
                        
                        {/* Purchase Card */}
                        <div className="border-2 border-black bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0">
                            <div className="p-6 border-b-2 border-black bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase text-neutral-500 tracking-widest">Current Price</span>
                                    <Badge variant="outline" className={`border-2 border-black rounded-none font-bold uppercase text-xs ${asset.status === 'verified' ? "bg-green-300 text-black" : "bg-neutral-200 text-neutral-500"}`}>
                                        {asset.status === 'verified' ? "Live Market" : "Unlisted"}
                                    </Badge>
                                </div>
                                <div className="text-5xl font-black text-black font-mono flex items-center gap-1">
                                    {asset.price}
                                </div>
                            </div>
                            <div className="p-6">
                                <Button 
                                    className="w-full h-14 text-lg font-black uppercase bg-black text-white border-2 border-black rounded-none hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)]"
                                    onClick={handlePurchase} 
                                    disabled={asset.status !== 'verified'}
                                >
                                    {asset.status === 'verified' ? "BUY LICENSE" : "VERIFICATION PENDING"}
                                </Button>
                                <p className="text-[10px] font-bold text-center text-black mt-3 uppercase tracking-wide opacity-70">
                                    Includes Commercial Rights (PIL) & PDF Download.
                                </p>
                            </div>
                        </div>

                        {/* Provenance Card */}
                        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neutral-100 border-b-2 border-black p-4 flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                <h3 className="font-black uppercase text-lg">On-Chain Data</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b-2 border-black border-dashed">
                                    <span className="text-xs font-bold uppercase text-neutral-500">Asset ID</span>
                                    <div 
                                        className="flex items-center gap-2 font-mono text-xs font-bold bg-black text-white px-2 py-1 cursor-pointer hover:bg-yellow-300 hover:text-black transition-colors" 
                                        onClick={() => handleCopy(asset.id)}
                                    >
                                        {asset.id.slice(0, 10)}... <Copy className="w-3 h-3" />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-10 text-xs font-bold uppercase border-2 border-black rounded-none hover:bg-black hover:text-white transition-all"
                                    onClick={() => window.open(`https://sepolia.arbiscan.io/address/${asset.id}`, '_blank')}
                                >
                                    View on Arbiscan <ExternalLink className="ml-2 h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}