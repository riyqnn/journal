import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertTriangle, DollarSign, Award, BookOpen, Clock, ArrowRight, BrainCircuit, Database, FileText, ShieldCheck, Loader2, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useContract, PaperMetadata, PaperStatus } from "@/hooks/useContract";
import { usePapersByStatus, useVerifierStats, useUSDCBalance, useUserVerifications, useRejectedPapers } from "@/hooks/useContractQuery";
import { useVerifier } from "@/hooks/useVerifier";
import { PRICING } from "@/config/pricing";

export default function VerifyPage() {
    const { address } = useAccount();
    const { updatePaperStatus, getPaperAIScore } = useContract();
    const { verifyPaper, claimReward, isVerifier, registerVerifier, isVerifying, isClaiming } = useVerifier();
    const queryClient = useQueryClient();

    // Use React Query for optimized data fetching with background refresh
    const { data: tasks = [], isLoading: isLoadingTasks, refetch: refetchTasks, isRefetching: isRefetchingTasks } = usePapersByStatus(PaperStatus.Draft);
    const { data: verifierStats, isLoading: isLoadingStats, refetch: refetchStats } = useVerifierStats(address);
    const { data: balanceData, isLoading: isLoadingBalance } = useUSDCBalance(address);

    // New hooks for history tab
    const { data: userVerifications = [], isLoading: isLoadingUserHistory } = useUserVerifications(address);
    const { data: rejectedPapers = [], isLoading: isLoadingRejected, refetch: refetchRejected } = useRejectedPapers();

    const [isRegistering, setIsRegistering] = useState(false);

    // Pagination state for queue
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Pagination state for history
    const [historyPage, setHistoryPage] = useState(1);
    const HISTORY_ITEMS_PER_PAGE = 10;

    // AI scores cache
    const [aiScores, setAiScores] = useState<Record<string, number>>({});

    // Track papers being verified for optimistic UI updates
    const [verifyingTokenIds, setVerifyingTokenIds] = useState<Set<string>>(new Set());

    // Track processing tokens to prevent duplicate transactions
    const processingRef = useRef<Record<string, boolean>>({});

    // Computed stats from blockchain data with useMemo for performance
    const reviewerStats = useMemo(() => {
        if (!verifierStats) {
            return {
                reputation: 0,
                level: "BRONZE",
                earnings: "0",
                reviewedCount: 0,
                unclaimedRewards: 0,
            };
        }

        const tierLabels = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
        return {
            reputation: Math.round((Number(verifierStats.correctVerifications) / Number(verifierStats.totalVerifications)) * 1000) || 0,
            level: tierLabels[verifierStats.tier] || "BRONZE",
            earnings: (Number(verifierStats.rewardsEarned) / 1e6).toFixed(2), // Convert from 6 decimals
            reviewedCount: Number(verifierStats.totalVerifications),
            unclaimedRewards: 0, // TODO: Implement unclaimed rewards tracking
        };
    }, [verifierStats]);

    // USDC balance with useMemo
    const usdcBalance = useMemo(() => {
        if (!balanceData) return "0";
        return (Number(balanceData) / 1e6).toFixed(2); // Convert from 6 decimals
    }, [balanceData]);

    // Initial load state (only true on first load, not on background refetch)
    const isInitialLoad = useMemo(() => {
        return !address || (isLoadingStats && isLoadingBalance);
    }, [address, isLoadingStats, isLoadingBalance]);

    // Fetch AI scores for all papers in queue
    useEffect(() => {
        const fetchScores = async () => {
            const scores: Record<string, number> = {};
            await Promise.all(
                tasks.map(async (task) => {
                    const score = await getPaperAIScore(task.ipfsHash);
                    if (score !== null) {
                        scores[task.tokenId] = score;
                    }
                })
            );
            setAiScores(scores);
        };
        if (tasks.length > 0) {
            fetchScores();
        }
    }, [tasks, getPaperAIScore]);

    // Pagination logic for queue
    const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const displayTasks = useMemo(() =>
        tasks.slice(startIndex, startIndex + ITEMS_PER_PAGE),
        [tasks, startIndex]
    );

    // Filter out papers currently being verified (optimistic UI update)
    const visibleTasks = useMemo(() =>
        displayTasks.filter(task => !verifyingTokenIds.has(task.tokenId)),
        [displayTasks, verifyingTokenIds]
    );

    // Combine history items: user's approved + all rejected
    const historyItems = useMemo(() => {
        // Add isRejected flag to rejected papers
        const rejectedWithFlag = rejectedPapers.map(p => ({
            ...p,
            isRejected: true,
            timestamp: p.mintedAt ? BigInt(new Date(p.mintedAt).getTime() / 1000) : BigInt(0),
        }));

        // Combine and sort by timestamp descending
        return [...userVerifications, ...rejectedWithFlag].sort((a, b) => {
            const timeA = Number(a.timestamp || 0);
            const timeB = Number(b.timestamp || 0);
            return timeB - timeA;
        });
    }, [userVerifications, rejectedPapers]);

    // Pagination for history
    const totalHistoryPages = Math.ceil(historyItems.length / HISTORY_ITEMS_PER_PAGE);
    const historyStartIndex = (historyPage - 1) * HISTORY_ITEMS_PER_PAGE;
    const displayHistoryItems = useMemo(() =>
        historyItems.slice(historyStartIndex, historyStartIndex + HISTORY_ITEMS_PER_PAGE),
        [historyItems, historyStartIndex]
    );

    // Reset page when search changes (for future search functionality)
    useEffect(() => {
        setCurrentPage(1);
    }, [tasks.length]);

    // Reset history page when data changes
    useEffect(() => {
        setHistoryPage(1);
    }, [historyItems.length]);

    // Handle verifier registration
    const handleRegisterVerifier = async () => {
        if (!address) {
            toast.error("Please connect your wallet first");
            return;
        }

        setIsRegistering(true);
        try {
            const result = await registerVerifier();
            if (result.success) {
                toast.success("Successfully registered as verifier!");
                // Refetch stats to get updated data
                refetchStats();
            } else {
                toast.error(result.error || "Registration failed");
            }
        } catch (error) {
            console.error("Error registering verifier:", error);
            toast.error("Failed to register as verifier");
        } finally {
            setIsRegistering(false);
        }
    };

    // Handle verification (approve/reject)
    const handleVote = async (tokenId: string, decision: 'APPROVE' | 'REJECT') => {
        // EARLY RETURN: Prevent duplicate calls
        if (verifyingTokenIds.has(tokenId) || isVerifying || processingRef.current[tokenId]) {
            console.log("Already verifying this paper, ignoring duplicate click");
            return;
        }

        // Optimistic update FIRST (before any async operations)
        setVerifyingTokenIds(prev => new Set(prev).add(tokenId));
        processingRef.current[tokenId] = true;

        try {
            if (!address) {
                toast.error("Please connect your wallet first");
                // Remove from verifying set since we failed before blockchain operation
                setVerifyingTokenIds(prev => {
                    const next = new Set(prev);
                    next.delete(tokenId);
                    return next;
                });
                return;
            }

            // Check if registered as verifier
            const registered = await isVerifier(address);
            if (!registered) {
                toast.error("You must register as a verifier first");
                // Remove from verifying set since we failed before blockchain operation
                setVerifyingTokenIds(prev => {
                    const next = new Set(prev);
                    next.delete(tokenId);
                    return next;
                });
                return;
            }

            // 1. Submit verification to blockchain
            const comment = decision === 'APPROVE'
                ? "Paper meets quality standards and passes verification"
                : "Paper does not meet required standards";

            const result = await verifyPaper(BigInt(tokenId), decision === 'APPROVE', comment);

            if (!result.success) {
                toast.error(result.error || "Verification failed");
                // Remove from verifying set since verification failed
                setVerifyingTokenIds(prev => {
                    const next = new Set(prev);
                    next.delete(tokenId);
                    return next;
                });
                return;
            }

            // 2. Claim reward immediately after verification
            const rewardResult = await claimReward(BigInt(tokenId));

            if (rewardResult.success) {
                const aiScore = aiScores[tokenId] || 0;
                const reward = PRICING.getRewardForScore(aiScore);
                toast.success(decision === 'APPROVE' ? `Paper Verified! +${reward}` : "Paper Rejected. Reward claimed.", {
                    description: decision === 'APPROVE'
                        ? "License upgraded to Commercial (PIL). Asset is now verified."
                        : "License downgraded. Moved to rejected pool.",
                });
            } else {
                toast.success("Verification submitted!", {
                    description: rewardResult.error || "Reward will be available to claim.",
                });
            }

            // Refetch stats and queue to get updated data
            refetchStats();

            // Defer query invalidation to avoid setState during render
            setTimeout(() => {
              // Invalidate queries to force immediate cache refresh
              queryClient.invalidateQueries({ queryKey: ['papers', 'status', PaperStatus.Draft] });
              queryClient.invalidateQueries({ queryKey: ['verifier', 'stats', address] }); // Force refresh stats
              queryClient.invalidateQueries({ queryKey: ['verifier', 'history', address] });
              queryClient.invalidateQueries({ queryKey: ['usdc', 'balance', address] }); // Force refresh USDC balance
            }, 0);

        } catch (error: any) {
            console.error("Error handling vote:", error);

            // Check if already verified
            if (error.message?.includes("Already verified") || error.reason?.includes("Already verified")) {
                toast.info("Paper Already Verified", {
                    description: "This paper has been verified. Refreshing the queue..."
                });
                // Defer query invalidation to avoid setState during render
                setTimeout(() => {
                  // Force refetch to update UI
                  queryClient.invalidateQueries({ queryKey: ['papers', 'status', PaperStatus.Draft] });
                }, 0);
                // Don't remove from verifying set - the paper is already verified
                return;
            }

            toast.error("Failed to process verification");
        } finally {
            // Clean up processing flag
            processingRef.current[tokenId] = false;
        }
    };

    // Handle manual refresh
    const handleRefresh = async () => {
        await Promise.all([refetchTasks(), refetchStats(), refetchRejected()]);
    };

    return (
        <div className="min-h-screen bg-white pb-20 pt-12 font-sans selection:bg-yellow-300 selection:text-black">

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">

                {/* HEADER */}
                <div className="mb-12 border-b-4 border-black pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="inline-block bg-black text-white px-3 py-1 text-sm font-bold font-mono transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)]">
                                PEER REVIEW PROTOCOL
                            </div>
                            <div className="inline-flex items-center gap-1 bg-green-100 border-2 border-black px-3 py-1 text-sm font-bold">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                LIVE BLOCKCHAIN
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                            Reviewer <br className="md:hidden" /> Hub
                        </h1>
                        <p className="text-xl font-medium text-neutral-800 mt-4 border-l-4 border-black pl-4">
                            Validate AI findings, curate the Knowledge Graph, and earn <span className="font-bold bg-green-200 px-1 border border-black">{PRICING.VERIFICATION_REWARD}</span> per verification.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        {!address ? (
                            <Button disabled className="h-12 border-2 border-black bg-neutral-200 text-neutral-500 rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-not-allowed">
                                <Wallet className="mr-2 h-5 w-5" /> CONNECT WALLET
                            </Button>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 bg-neutral-100 border-2 border-black px-4 py-2 font-mono text-sm">
                                    <Wallet className="h-4 w-4" />
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </div>
                                <Button
                                    onClick={handleRefresh}
                                    disabled={isInitialLoad}
                                    className="h-12 border-2 border-black bg-white text-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                                >
                                    {isRefetchingTasks ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                                    REFRESH
                                </Button>
                            </>
                        )}
                        <Button className="h-12 border-2 border-black bg-white text-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <BookOpen className="mr-2 h-5 w-5" /> VIEW GUIDELINES
                        </Button>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {/* Reputation Card */}
                    <div className="bg-blue-100 p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-white p-2 border-2 border-black">
                                <Award className="h-6 w-6 text-black" />
                            </div>
                            <div className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase">{reviewerStats.level}</div>
                        </div>
                        <div className="text-4xl font-black font-mono mb-1">{reviewerStats.reputation}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-600">
                            Reputation Score
                        </div>
                    </div>

                    {/* Tasks Card */}
                    <div className="bg-purple-100 p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-white p-2 border-2 border-black">
                                <BrainCircuit className="h-6 w-6 text-black" />
                            </div>
                            <div className="bg-red-500 text-white px-2 py-0.5 text-xs font-bold uppercase border border-black animate-pulse">High Priority</div>
                        </div>
                        <div className="text-4xl font-black font-mono mb-1">{tasks.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-600">
                            Pending Validations
                        </div>
                    </div>

                    {/* Earnings Card */}
                    <div className="bg-green-100 p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-white p-2 border-2 border-black">
                                <DollarSign className="h-6 w-6 text-black" />
                            </div>
                            <div className="bg-green-600 text-white px-2 py-0.5 text-xs font-bold uppercase border border-black">TOTAL</div>
                        </div>
                        <div className="text-4xl font-black font-mono mb-1">{reviewerStats.earnings} <span className="text-xl">USDC</span></div>
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-600">
                            Lifetime Earnings
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-yellow-100 p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-white p-2 border-2 border-black">
                                <Wallet className="h-6 w-6 text-black" />
                            </div>
                            <div className="bg-yellow-600 text-white px-2 py-0.5 text-xs font-bold uppercase border border-black">WALLET</div>
                        </div>
                        <div className="text-4xl font-black font-mono mb-1">{usdcBalance} <span className="text-xl">USDC</span></div>
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-600">
                            Your Balance
                        </div>
                    </div>
                </div>

                {/* Registration Notice for non-verifiers */}
                {address && !isInitialLoad && reviewerStats.level === "BRONZE" && reviewerStats.reviewedCount === 0 && (
                    <div className="mb-8 p-6 bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-black text-white p-3 border-2 border-white">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase">Not Registered as Verifier</h3>
                                <p className="font-bold text-sm">Register to start verifying papers and earning {PRICING.VERIFICATION_REWARD} per verification</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleRegisterVerifier}
                            disabled={isRegistering}
                            className="h-14 px-8 bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                            {isRegistering ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                            {isRegistering ? "Registering..." : "REGISTER AS VERIFIER"}
                        </Button>
                    </div>
                )}

                {/* TASK LIST SECTION */}
                <Tabs defaultValue="queue" className="w-full">
                    <div className="flex items-center gap-4 mb-8">
                        <TabsList className="bg-transparent gap-2 p-0 h-auto">
                            <TabsTrigger
                                value="queue"
                                className="h-12 px-6 border-2 border-transparent rounded-none font-black text-lg uppercase data-[state=active]:bg-yellow-300 data-[state=active]:text-black data-[state=active]:border-black data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition-all"
                            >
                                Verification Queue {isRefetchingTasks && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="h-12 px-6 border-2 border-transparent rounded-none font-black text-lg uppercase data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-neutral-100 transition-all"
                            >
                                My History
                            </TabsTrigger>
                        </TabsList>
                        <div className="h-1 flex-1 bg-black hidden md:block mt-2"></div>
                    </div>

                    <TabsContent value="queue" className="space-y-8">
                        {isInitialLoad || isLoadingTasks ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-6 border-2 border-black border-dashed bg-white">
                                <Loader2 className="h-16 w-16 animate-spin text-black" />
                                <p className="text-xl font-bold font-mono uppercase tracking-widest">Loading from Arbitrum Sepolia...</p>
                                <p className="text-sm text-neutral-500">Fetching Draft papers from smart contract</p>
                            </div>
                        ) : !address ? (
                            <div className="text-center py-20 bg-white border-4 border-black border-dashed">
                                <Wallet className="h-16 w-16 text-black mx-auto mb-4" />
                                <h3 className="text-3xl font-black uppercase mb-2">Wallet Not Connected</h3>
                                <p className="text-xl font-bold text-neutral-500">Please connect your wallet to view verification tasks</p>
                            </div>
                        ) : visibleTasks.length === 0 ? (
                            <div className="text-center py-20 bg-white border-4 border-black border-dashed">
                                {verifyingTokenIds.size > 0 ? (
                                    <>
                                        <Loader2 className="h-16 w-16 text-black mx-auto mb-4 animate-spin" />
                                        <h3 className="text-3xl font-black uppercase mb-2">Processing Verification...</h3>
                                        <p className="text-xl font-bold text-neutral-500">Please wait while the transaction completes</p>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-16 w-16 text-black mx-auto mb-4" />
                                        <h3 className="text-3xl font-black uppercase mb-2">All Caught Up!</h3>
                                        <p className="text-xl font-bold text-neutral-500">No pending verifications. Check back later.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            visibleTasks.map((task) => {
                                const aiScore = aiScores[task.tokenId] || 0;
                                const reward = PRICING.getRewardForScore(aiScore);

                                return (
                                <Card key={task.tokenId} className="group overflow-visible border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white relative">


                                    {/* Header */}
                                    <div className="p-6 md:p-8 border-b-2 border-black bg-neutral-50 flex flex-col md:flex-row justify-between gap-6 pl-6 pt-12 md:pt-8 md:pl-8">
                                        <div className="space-y-3">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <Badge variant="outline" className="text-xs font-bold border-2 border-black bg-white rounded-none px-2 py-0.5">
                                                    RESEARCH
                                                </Badge>
                                                <Badge variant="outline" className="text-xs font-bold font-mono border-2 border-black bg-yellow-200 rounded-none px-2 py-0.5">
                                                    TOKEN #{task.tokenId}
                                                </Badge>
                                                {aiScore > 0 && (
                                                    <Badge variant="outline" className="text-xs font-bold font-mono border-2 border-black bg-blue-100 rounded-none px-2 py-0.5">
                                                        AI SCORE: {aiScore}/100
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-3xl font-black uppercase leading-none">{task.title}</h3>
                                            <p className="font-bold text-neutral-500 text-sm">
                                                SUBMITTED BY <span className="text-black bg-yellow-200 px-1 border border-black">{task.author || "Anonymous"}</span>
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <div className={`border-2 border-black p-3 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[120px] ${aiScore >= 80 ? 'bg-green-100' : aiScore >= 70 ? 'bg-yellow-100' : 'bg-orange-100'}`}>
                                                <div className="text-xs font-bold uppercase mb-1">Bounty</div>
                                                <div className="text-2xl font-black font-mono flex items-center justify-center gap-1">
                                                    <DollarSign className="h-5 w-5" /> {reward.replace(' USDC', '')} <span className="text-sm">USDC</span>
                                                </div>
                                                {aiScore > 0 && (
                                                    <div className="text-xs font-bold text-neutral-600 mt-1">
                                                        {aiScore >= 90 ? 'EXCELLENT' : aiScore >= 80 ? 'HIGH' : aiScore >= 70 ? 'GOOD' : 'STANDARD'} QUALITY
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid md:grid-cols-3 gap-0">

                                        {/* Abstract (Left Col) */}
                                        <div className="md:col-span-2 p-6 md:p-8 space-y-4 border-r-0 md:border-r-2 border-black">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="h-5 w-5 text-black" />
                                                <h4 className="text-lg font-black uppercase">Abstract</h4>
                                            </div>
                                            <p className="text-base font-medium leading-relaxed bg-white p-4 border-2 border-neutral-200 text-neutral-800 font-mono">
                                                {task.ipfsHash ? `"Retrieved from blockchain: ${task.ipfsHash.slice(0, 20)}..."` : "No abstract available"}
                                            </p>
                                            {task.ipfsHash && (
                                                <a
                                                    href={`https://gateway.pinata.cloud/ipfs/${task.ipfsHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block"
                                                >
                                                    <Button variant="link" className="p-0 text-black font-bold uppercase underline decoration-2 hover:bg-yellow-300 px-1">
                                                        READ FULL PDF DOCUMENT <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>

                                        {/* Paper Info (Right Col) */}
                                        <div className="md:col-span-1 p-6 md:p-8 bg-neutral-100 space-y-6">
                                            <div className="flex items-center gap-2 mb-2 border-b-2 border-black pb-2">
                                                <Database className="h-5 w-5 text-purple-600" />
                                                <h4 className="text-lg font-black uppercase text-purple-600">Paper Details</h4>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <p className="text-[10px] font-bold uppercase text-neutral-500 mb-1">Status</p>
                                                    <p className="font-black text-xl uppercase leading-tight">{task.status}</p>
                                                </div>

                                                <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <p className="text-[10px] font-bold uppercase text-neutral-500 mb-1">Affiliation</p>
                                                    <p className="font-bold text-sm uppercase leading-tight">{task.affiliation || "N/A"}</p>
                                                </div>

                                                <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <p className="text-[10px] font-bold uppercase text-neutral-500 mb-1">Minted At</p>
                                                    <p className="font-mono text-xs">
                                                        {task.mintedAt ? new Date(task.mintedAt).toLocaleDateString() : "N/A"}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 text-green-700 font-bold text-xs uppercase">
                                                    <ShieldCheck className="h-4 w-4" /> Blockchain Verified
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-6 md:p-8 bg-black border-t-2 border-black flex flex-col md:flex-row justify-between items-center gap-6">
                                        <p className="text-xs font-mono font-bold text-neutral-400 uppercase hidden md:block">
                                            Verification is recorded immutably on Arbitrum Sepolia blockchain.
                                        </p>

                                        <div className="flex gap-4 w-full md:w-auto">
                                            <Button
                                                disabled={isVerifying}
                                                className="flex-1 md:w-48 h-12 bg-white text-red-600 border-2 border-white hover:bg-red-600 hover:text-white rounded-none font-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => handleVote(task.tokenId, 'REJECT')}
                                            >
                                                {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <XCircle className="mr-2 h-5 w-5" />}
                                                {isVerifying ? "VERIFYING..." : "REJECT PAPER"}
                                            </Button>
                                            <Button
                                                disabled={isVerifying}
                                                className="flex-1 md:w-48 h-12 bg-green-500 text-black border-2 border-green-500 hover:bg-green-400 hover:border-green-400 rounded-none font-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => handleVote(task.tokenId, 'APPROVE')}
                                            >
                                                {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                                {isVerifying ? "VERIFYING..." : `APPROVE & EARN ${reward}`}
                                            </Button>
                                        </div>
                                    </div>

                                </Card>
                                );
                            })
                        )}

                        {/* Pagination for Queue */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <Button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="h-10 px-6 border-2 border-black bg-white text-black rounded-none font-bold hover:bg-black hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center px-4 font-mono font-bold">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="h-10 px-6 border-2 border-black bg-white text-black rounded-none font-bold hover:bg-black hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        {isLoadingUserHistory || isLoadingRejected ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-6 border-2 border-black border-dashed bg-white">
                                <Loader2 className="h-16 w-16 animate-spin text-black" />
                                <p className="text-xl font-bold font-mono uppercase tracking-widest">Loading verification history...</p>
                            </div>
                        ) : historyItems.length === 0 ? (
                            <div className="text-center py-20 bg-white border-4 border-black border-dashed">
                                <Clock className="h-16 w-16 text-black mx-auto mb-4" />
                                <h3 className="text-3xl font-black uppercase mb-2">No History Yet</h3>
                                <p className="text-xl font-bold text-neutral-500">Your verification history will appear here</p>
                            </div>
                        ) : (
                            <>
                                {/* History Header */}
                                <div className="mb-6 flex justify-between items-center">
                                    <h2 className="text-2xl font-black uppercase">Verification History ({historyItems.length})</h2>
                                    <div className="text-sm font-mono font-bold text-neutral-600">
                                        Showing {displayHistoryItems.length} of {historyItems.length}
                                    </div>
                                </div>

                                {/* History Cards */}
                                <div className="space-y-6">
                                    {displayHistoryItems.map((item: any) => {
                                        const isRejected = item.isRejected;
                                        const itemAIScore = item.aiScore || aiScores[item.tokenId] || 0;
                                        const itemReward = PRICING.getRewardForScore(itemAIScore);

                                        return (
                                            <Card key={item.tokenId} className={`border-2 ${isRejected ? 'border-red-500 bg-red-50' : 'border-black bg-white'} rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                                                <div className="p-6 flex flex-col md:flex-row justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            <h3 className="text-xl font-black uppercase">{item.paper?.title || item.title}</h3>
                                                            {isRejected ? (
                                                                <Badge className="bg-red-600 text-white border-2 border-black rounded-none">
                                                                    <XCircle className="w-4 h-4 mr-1" /> REJECTED
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-green-500 text-black border-2 border-black rounded-none">
                                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> APPROVED
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-xs font-bold font-mono border-2 border-black bg-white rounded-none">
                                                                TOKEN #{item.tokenId}
                                                            </Badge>
                                                            {itemAIScore > 0 && (
                                                                <Badge variant="outline" className="text-xs font-bold font-mono border-2 border-black bg-blue-100 rounded-none">
                                                                    AI: {itemAIScore}/100
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                                                            <span className="font-bold">
                                                                By: {item.paper?.author || item.author || "Unknown"}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="font-mono">
                                                                {item.timestamp
                                                                    ? new Date(Number(item.timestamp) * 1000).toLocaleString()
                                                                    : (item.mintedAt ? new Date(item.mintedAt).toLocaleDateString() : "Unknown date")
                                                                }
                                                            </span>
                                                        </div>
                                                        {isRejected && (
                                                            <p className="text-sm font-bold text-red-600 mt-2">
                                                                This paper was rejected and moved to the rejected pool
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold uppercase text-neutral-500 mb-1">Reward</div>
                                                        <div className={`text-2xl font-black font-mono ${isRejected ? 'text-red-600 line-through' : 'text-green-600'}`}>
                                                            {itemReward}
                                                        </div>
                                                        {isRejected && (
                                                            <div className="text-xs font-bold text-red-600 mt-1">
                                                                No reward
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Pagination for History */}
                                {totalHistoryPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mt-8">
                                        <Button
                                            disabled={historyPage === 1}
                                            onClick={() => setHistoryPage(p => p - 1)}
                                            className="h-10 px-6 border-2 border-black bg-white text-black rounded-none font-bold hover:bg-black hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                                        >
                                            Previous
                                        </Button>
                                        <span className="flex items-center px-4 font-mono font-bold">
                                            Page {historyPage} of {totalHistoryPages}
                                        </span>
                                        <Button
                                            disabled={historyPage >= totalHistoryPages}
                                            onClick={() => setHistoryPage(p => p + 1)}
                                            className="h-10 px-6 border-2 border-black bg-white text-black rounded-none font-bold hover:bg-black hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}