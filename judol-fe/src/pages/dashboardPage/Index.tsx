import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Wallet, FileText, TrendingUp, Settings,
    PlusCircle, ExternalLink,
    Clock, CheckCircle2, Copy, ShieldCheck, DollarSign, BarChart3, Award
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useUserAssets, useUserStats } from "@/hooks/useUserAssets";
import { useUSDC } from "@/hooks/useUSDC";
import { useContract } from "@/hooks/useContract";
import { useVerifierRegistry, VerifierTier } from "@/hooks/useVerifierRegistry";
import { PRICING } from "@/config/pricing";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
    const { address } = useAccount();
    const { getPaperAIScore } = useContract();
    const { getVerifierStats, isVerifier, registerVerifier, isRegistering } = useVerifierRegistry();

    // Use React Query hooks for blockchain data
    const { data: assets = [], isLoading: isLoadingAssets } = useUserAssets();
    const { totalAssets, verifiedAssets } = useUserStats();
    const { getBalance } = useUSDC();

    const [copySuccess, setCopySuccess] = useState(false);
    const [usdcBalance, setUsdcBalance] = useState("0");
    const [mappedAssets, setMappedAssets] = useState<any[]>([]);
    const [aiScores, setAiScores] = useState<Record<string, number>>({});
    const [totalEarnings, setTotalEarnings] = useState("0");
    const [verifierStats, setVerifierStats] = useState<{
        tier: VerifierTier;
        totalVerifications: number;
        rewardsEarned: number;
    } | null>(null);
    const [isVerifierRegistered, setIsVerifierRegistered] = useState(false);

    // Fetch USDC balance
    useEffect(() => {
        if (address) {
            getBalance(address).then(balance => {
                setUsdcBalance((Number(balance) / 1e6).toFixed(2));
            }).catch(err => {
                console.error("Error fetching USDC balance:", err);
            });
        }
    }, [address, getBalance]);

    // Fetch AI scores for all assets
    useEffect(() => {
        const fetchScores = async () => {
            const scores: Record<string, number> = {};
            await Promise.all(
                assets.map(async (asset) => {
                    const score = await getPaperAIScore(asset.ipfsHash);
                    if (score !== null) {
                        scores[asset.tokenId] = score;
                    }
                })
            );
            setAiScores(scores);
        };
        if (assets.length > 0) {
            fetchScores();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assets]); // Remove getPaperAIScore from deps to prevent infinite loop

    // Fetch verifier stats
    useEffect(() => {
        const fetchVerifierData = async () => {
            if (address) {
                const [isRegistered, stats] = await Promise.all([
                    isVerifier(address),
                    getVerifierStats(address)
                ]);
                setIsVerifierRegistered(isRegistered);
                if (stats) {
                    setVerifierStats({
                        tier: stats.tier,
                        totalVerifications: stats.totalVerifications,
                        rewardsEarned: stats.rewardsEarned / 1e6, // Convert from 6 decimals
                    });
                }
            }
        };
        fetchVerifierData();
    }, [address, isVerifier, getVerifierStats]);

    // Map contract assets to display format with dynamic pricing
    useEffect(() => {
        if (assets.length > 0) {
            const mapped = assets.map((paper) => {
                const aiScore = aiScores[paper.tokenId] || 0;
                const isVerified = paper.status === "Verified";
                return {
                    id: paper.tokenId,
                    title: paper.title,
                    type: "Research IP",
                    status: paper.status.toLowerCase() as 'verified' | 'processing' | 'data_pool',
                    license: paper.license || "Commercial (PIL)",
                    earnings: isVerified ? PRICING.getRewardForScore(aiScore) : "0 USDC",
                    aiScore: aiScore,
                    views: Math.floor(Math.random() * 1000), // Simulated for now
                    mintDate: formatDistanceToNow(new Date(paper.mintedAt), { addSuffix: true }),
                };
            });
            setMappedAssets(mapped);

            // Calculate total earnings from verified assets
            const total = mapped
                .filter(a => a.status === 'verified')
                .reduce((sum, asset) => {
                    const amount = parseFloat(asset.earnings.replace(' USDC', ''));
                    return sum + amount;
                }, 0);
            setTotalEarnings(total.toFixed(2));
        }
    }, [assets, aiScores]);

    const formatAddress = (addr: string | undefined) => {
        if (!addr) return "Not Connected";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address); // Copy Full Address
            setCopySuccess(true);
            toast.success("Full address copied to clipboard");
            setTimeout(() => setCopySuccess(false), 2000);
        } else {
            toast.error("Wallet not connected");
        }
    };

    const handleSettings = () => {
        toast.info("Feature Coming Soon", {
            description: "License management will be available in the next Mainnet upgrade."
        });
    };

    const handleWithdraw = () => {
        toast.info("Withdrawal Coming Soon", {
            description: "Reward distribution will be implemented after mainnet launch. Current earnings are projected values based on AI scores."
        });
    };

    const handleRegisterVerifier = async () => {
        const result = await registerVerifier();
        if (result.success) {
            // Refresh verifier status
            const registered = await isVerifier(address || "");
            setIsVerifierRegistered(registered);
            if (registered) {
                const stats = await getVerifierStats(address || "");
                if (stats) {
                    setVerifierStats({
                        tier: stats.tier,
                        totalVerifications: stats.totalVerifications,
                        rewardsEarned: stats.rewardsEarned / 1e6,
                    });
                }
            }
        }
    };

    const getTierLabel = (tier: VerifierTier) => {
        const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
        return tiers[tier] || "Bronze";
    };

    const getTierColor = (tier: VerifierTier) => {
        const colors = ["bg-orange-100", "bg-gray-200", "bg-yellow-100", "bg-blue-100"];
        return colors[tier] || "bg-orange-100";
    };

    return (
        <div className="min-h-screen pb-20 bg-white font-sans relative selection:bg-yellow-300 selection:text-black ">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="relative z-10 pt-12 pb-12 bg-opacity-20 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24 border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-yellow-300">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback className="text-2xl font-black">DR</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                                    {address ? "Dr. Researcher" : "Guest User"}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                                    <Badge variant="secondary" className="bg-blue-300 text-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1">
                                        <ShieldCheck className="h-4 w-4 mr-2" /> SINTA 2 VERIFIED
                                    </Badge>
                                    <span 
                                        className="flex items-center gap-2 cursor-pointer bg-neutral-100 border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none font-mono uppercase" 
                                        onClick={handleCopyAddress}
                                        title={address} // Tooltip show full address
                                    >
                                        {formatAddress(address)}
                                        {copySuccess ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-w-[140px]">
                                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Projected Earnings</span>
                                <span className="text-3xl font-black font-mono text-green-600">{totalEarnings} USDC</span>
                                <span className="text-[8px] text-neutral-400 font-mono">Based on AI scores</span>
                            </div>
                            <Link to="/mint">
                                <Button className="h-full w-full sm:w-auto px-8 text-lg bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    <PlusCircle className="mr-2 h-5 w-5" /> MINT NEW IP
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN DASHBOARD CONTENT */}
            <div className="container mx-auto px-4 md:px-6 py-12 relative z-10">
                <Tabs defaultValue="assets" className="space-y-8">
                    
                    <TabsList className="bg-transparent gap-4 p-0 h-auto flex-wrap justify-start w-full border-b-2 border-black pb-0 mb-8 rounded-none">
                        <TabsTrigger 
                            value="assets" 
                            className="
                                h-12 px-6 border-2 border-transparent border-b-0 rounded-none font-black text-lg uppercase 
                                data-[state=active]:bg-yellow-300 data-[state=active]:text-black data-[state=active]:border-black data-[state=active]:translate-y-[2px]
                                hover:bg-neutral-100 transition-all
                            "
                        >
                            <FileText className="w-5 h-5 mr-2" /> My IP Assets
                        </TabsTrigger>
                        <TabsTrigger 
                            value="finance" 
                            className="
                                h-12 px-6 border-2 border-transparent border-b-0 rounded-none font-black text-lg uppercase 
                                data-[state=active]:bg-green-300 data-[state=active]:text-black data-[state=active]:border-black data-[state=active]:translate-y-[2px]
                                hover:bg-neutral-100 transition-all
                            "
                        >
                            <Wallet className="w-5 h-5 mr-2" /> Royalty & Finance
                        </TabsTrigger>
                        <TabsTrigger 
                            value="settings" 
                            className="
                                h-12 px-6 border-2 border-transparent border-b-0 rounded-none font-black text-lg uppercase 
                                data-[state=active]:bg-neutral-300 data-[state=active]:text-black data-[state=active]:border-black data-[state=active]:translate-y-[2px]
                                hover:bg-neutral-100 transition-all ml-auto
                            "
                        >
                            <Settings className="w-5 h-5 mr-2" /> Settings
                        </TabsTrigger>
                    </TabsList>


                    <TabsContent value="assets" className="space-y-8 mt-0">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: "Total Assets", value: totalAssets.toString(), icon: FileText, bg: "bg-blue-100" },
                                { label: "Total Citations", value: verifiedAssets.toString(), icon: BarChart3, bg: "bg-purple-100" },
                                { label: "Reputation Score", value: "850", icon: TrendingUp, bg: "bg-green-100" },
                            ].map((stat, i) => (
                                <div key={i} className={`p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${stat.bg} flex items-center justify-between`}>
                                    <div>
                                        <div className="text-4xl font-black font-mono mb-1">{stat.value}</div>
                                        <div className="text-xs font-bold uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                    <stat.icon className="h-8 w-8 opacity-20" />
                                </div>
                            ))}
                        </div>

                        {/* Asset List */}
                        <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <CardHeader className="bg-neutral-50 border-b-2 border-black p-6">
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">My Intellectual Property</CardTitle>
                                <CardDescription className="text-black font-medium">Manage your minted research papers and datasets recorded on blockchain.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoadingAssets ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                                        <p className="font-bold text-lg">Loading from blockchain...</p>
                                    </div>
                                ) : mappedAssets.length === 0 ? (
                                    <div className="text-center py-20 bg-yellow-50">
                                        <FileText className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                                        <h3 className="text-2xl font-bold uppercase mb-2">No Assets Yet</h3>
                                        <p className="text-neutral-600 mb-6">You haven't minted any research papers yet.</p>
                                        <Link to="/mint">
                                            <Button className="bg-black text-white border-2 border-black rounded-none font-bold">Mint Your First Paper</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y-2 divide-black">
                                        {mappedAssets.map((asset) => (
                                            <div key={asset.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-yellow-50 transition-colors gap-6 group">

                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className={`p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${asset.status === 'verified' ? 'bg-blue-300' : 'bg-orange-300'}`}>
                                                        {asset.status === 'verified' ? <CheckCircle2 className="w-6 h-6 text-black" /> : <Clock className="w-6 h-6 text-black" />}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="font-black text-xl leading-none uppercase group-hover:underline decoration-2">{asset.title}</h4>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold font-mono">
                                                            <Badge variant="outline" className="border-2 border-black rounded-none bg-white px-2 py-0.5 text-black">
                                                                {asset.type.toUpperCase()}
                                                            </Badge>
                                                            <span>MINTED: {asset.mintDate}</span>
                                                            <span className="bg-neutral-200 px-1 border border-black">{asset.id}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Earnings</div>
                                                        <div className="font-black font-mono text-green-700 text-lg">{asset.earnings}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link to={`/asset/${asset.id}`}>
                                                            <Button variant="outline" size="icon" className="h-10 w-10 border-2 border-black rounded-none hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all" title="View Public Page">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Button>
                                                        </Link>

                                                        <Button variant="outline" size="icon" className="h-10 w-10 border-2 border-black rounded-none hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all" onClick={handleSettings} title="Manage License">
                                                            <Settings className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: FINANCE */}
                    <TabsContent value="finance" className="space-y-8 mt-0">
                        <div className="grid md:grid-cols-2 gap-8">

                            {/* Balance Card - Dark Mode Brutalist */}
                            <Card className="bg-black text-white border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(128,128,128,0.5)]">
                                <CardHeader className="border-b border-neutral-800 pb-4">
                                    <CardTitle className="text-neutral-400 font-bold uppercase tracking-widest text-sm">Available Balance</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 pb-6">
                                    <div className="text-5xl font-black font-mono mb-2 text-yellow-300">{usdcBalance} USDC</div>
                                    <p className="text-neutral-500 font-bold font-mono text-sm">≈ ${usdcBalance} USD</p>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button
                                        onClick={handleWithdraw}
                                        className="w-full h-12 bg-white text-black border-2 border-white hover:bg-neutral-200 rounded-none font-black uppercase tracking-wide transition-all"
                                    >
                                        <DollarSign className="w-4 h-4 mr-2" /> Withdraw to Wallet
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Verifier Rewards Card */}
                            {isVerifierRegistered && verifierStats ? (
                                <Card className={`${getTierColor(verifierStats.tier)} border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
                                    <CardHeader className="border-b-2 border-black">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="font-black uppercase tracking-tight flex items-center gap-2">
                                                <Award className="w-5 h-5" /> Verifier Rewards
                                            </CardTitle>
                                            <Badge className="bg-black text-white border-2 border-black rounded-none font-bold">
                                                {getTierLabel(verifierStats.tier)}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-black font-medium">
                                            Earn 50 USDC per verified paper
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-neutral-600 uppercase">Total Verifications</span>
                                                <span className="text-2xl font-black font-mono">{verifierStats.totalVerifications}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-neutral-600 uppercase">Rewards Earned</span>
                                                <span className="text-2xl font-black font-mono text-green-600">{verifierStats.rewardsEarned.toFixed(2)} USDC</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Link to="/verify" className="w-full">
                                            <Button
                                                className="w-full h-12 bg-black text-white border-2 border-black hover:bg-neutral-800 rounded-none font-black uppercase tracking-wide transition-all"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" /> Claim Rewards
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ) : (
                                /* Not a verifier - show info card */
                                <Card className="border-2 border-black border-dashed rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-neutral-50">
                                    <CardHeader className="border-b-2 border-black bg-neutral-100">
                                        <CardTitle className="font-black uppercase tracking-tight flex items-center gap-2">
                                            <Award className="w-5 h-5" /> Become a Verifier
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <p className="font-bold text-neutral-600 mb-4">
                                            Join our verifier network and earn 50 USDC for each paper you verify!
                                        </p>
                                        <ul className="text-sm space-y-2 mb-4">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span>Verify research papers for quality</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span>Earn 50 USDC per verification</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span>Build reputation and climb tiers</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button
                                            onClick={handleRegisterVerifier}
                                            disabled={isRegistering}
                                            className="w-full h-12 bg-black text-white border-2 border-black hover:bg-neutral-800 rounded-none font-black uppercase tracking-wide transition-all"
                                        >
                                            {isRegistering ? "Registering..." : "Register as Verifier"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}

                            {/* Recent Transactions - Placeholder */}
                            <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white md:col-span-2">
                                <CardHeader className="border-b-2 border-black bg-neutral-50">
                                    <CardTitle className="font-black uppercase tracking-tight">Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="text-center py-12 text-neutral-500">
                                        <p className="font-bold">Transaction history coming soon</p>
                                        <p className="text-sm mt-2">View your on-chain transaction history on the block explorer</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0">
                        <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-neutral-100 border-dashed">
                            <CardContent className="py-20 text-center flex flex-col items-center">
                                <Settings className="h-12 w-12 text-black mb-4 animate-spin-slow" />
                                <h3 className="text-2xl font-black uppercase">Settings Module</h3>
                                <p className="font-bold text-neutral-500 uppercase mt-2">Under Construction for Mainnet Launch</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}