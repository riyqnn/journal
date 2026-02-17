import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Vote, Users, Coins, Clock, CheckCircle2, XCircle, Search, Plus, ArrowRight, UserCheck, Copy, ShieldCheck, FileText, Send, Megaphone, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGovernance, Proposal, ProposalType, ProposalStatus } from "@/hooks/useGovernance";
import { useGovernanceProposals, calculateVotingStats } from "@/hooks/useGovernanceIndexer";
import { useVotingPower } from "@/hooks/useContractQuery";
import { useAccount } from "wagmi";
import { toast } from "sonner";

// --- KONFIGURASI VISUAL NEO-BRUTALIST ---
const typeConfig = {
    0: { label: "JOURNAL", color: "bg-blue-300 text-black border-black" },
    1: { label: "REVIEWER", color: "bg-purple-300 text-black border-black" },
    2: { label: "TREASURY", color: "bg-yellow-300 text-black border-black" },
    3: { label: "POLICY", color: "bg-slate-300 text-black border-black" }
};

const statusConfig = {
    0: { label: "ACTIVE", icon: Clock, color: "bg-green-300 text-black border-black" },
    1: { label: "PASSED", icon: CheckCircle2, color: "bg-blue-300 text-black border-black" },
    2: { label: "REJECTED", icon: XCircle, color: "bg-red-300 text-black border-black" },
    3: { label: "EXECUTED", icon: CheckCircle2, color: "bg-purple-300 text-black border-black" }
};

export default function GovernancePage() {
    const { address } = useAccount();
    const { vote, isVoting, createProposal, isCreating, executeProposal, delegateVote } = useGovernance();
    const queryClient = useQueryClient();

    // Use React Query for optimized data fetching with background refresh
    const { data: proposals = [], isLoading: isLoadingProposals, refetch: refetchProposals, isRefetching: isRefetchingProposals } = useGovernanceProposals(true); // Enable auto-refresh
    const { data: votingPower = 0n, isLoading: isLoadingVotingPower, refetch: refetchVotingPower } = useVotingPower(address);

    const [activeTab, setActiveTab] = useState("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [delegateAddress, setDelegateAddress] = useState("");
    const [proposalOpen, setProposalOpen] = useState(false);
    const [delegationOpen, setDelegationOpen] = useState(false);
    const [isDelegating, setIsDelegating] = useState(false);
    const [newProp, setNewProp] = useState({ title: "", type: "0", desc: "" });

    // Initial load state (only true on first load, not on background refetch)
    const isInitialLoad = useMemo(() => isLoadingProposals, [isLoadingProposals]);

    // Computed stats with useMemo for performance
    const stats = useMemo(() => {
        const activeProposals = proposals.filter(p => Number(p.status) === ProposalStatus.Active);
        const totalVotes = proposals.reduce((sum, p) => sum + Number(p.totalVotes), 0);
        return {
            activeProposals: activeProposals.length,
            totalProposals: proposals.length,
            votingPower: votingPower,
            isConnected: !!address,
        };
    }, [proposals, votingPower, address]);

    // Filtered proposals with useMemo (only recalculates when dependencies change)
    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
            const matchesTab = activeTab === "all" ? true :
                activeTab === "active" ? Number(p.status) === ProposalStatus.Active :
                activeTab === "passed" ? (Number(p.status) === ProposalStatus.Passed || Number(p.status) === ProposalStatus.Executed) :
                activeTab === "rejected" ? Number(p.status) === ProposalStatus.Rejected :
                true; // fallback for "all"
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [proposals, activeTab, searchQuery]);

    // Handle submit proposal
    const handleSubmitProposal = useCallback(async () => {
        if (!newProp.title || !newProp.type) {
            // Defer toast to after render
            setTimeout(() => toast.error("Please fill in required fields"), 0);
            return;
        }

        const result = await createProposal(
            newProp.title,
            newProp.desc || "No description provided",
            parseInt(newProp.type) as ProposalType,
            7 * 24 * 60 * 60 // 7 days
        );

        if (result.success) {
            // Batch state updates together
            setProposalOpen(false);
            setNewProp({ title: "", type: "0", desc: "" });

            // Defer query invalidation to avoid setState during render
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['governance', 'proposals'] });
                queryClient.invalidateQueries({ queryKey: ['governance', 'stats'] });
                refetchProposals();
            }, 0);
        } else {
            // Show error from hook if it failed
            if (result.error) {
                toast.error(result.error);
            }
        }
    }, [newProp, createProposal, refetchProposals, queryClient]);

    // Handle vote
    const handleVote = useCallback(async (proposalId: number, support: boolean) => {
        if (!address) {
            // Defer toast to after render
            setTimeout(() => toast.error("Please connect your wallet first"), 0);
            return;
        }

        const result = await vote(proposalId, support);
        if (result.success) {
            // Defer query invalidation to avoid setState during render
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['governance', 'proposals'] });
                queryClient.invalidateQueries({ queryKey: ['governance', 'stats'] });
                queryClient.invalidateQueries({ queryKey: ['governance', 'votingPower', address] });
                refetchProposals();
                refetchVotingPower();
            }, 0);
        } else {
            // Show error from hook if it failed
            if (result.error) {
                toast.error(result.error);
            }
        }
    }, [address, vote, refetchProposals, refetchVotingPower, queryClient]);

    // Handle delegation
    const handleDelegate = useCallback(async () => {
        if (!address) {
            // Defer toast to after render
            setTimeout(() => toast.error("Please connect your wallet first"), 0);
            return;
        }

        if (!delegateAddress) {
            // Defer toast to after render
            setTimeout(() => toast.error("Please enter a delegate address"), 0);
            return;
        }

        setIsDelegating(true);
        const result = await delegateVote(delegateAddress);

        if (result.success) {
            setDelegateAddress("");
            setDelegationOpen(false);

            // Defer query invalidation to avoid setState during render
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['governance', 'votingPower', address] });
                refetchVotingPower();
            }, 0);
        } else {
            // Show error from hook if it failed
            if (result.error) {
                toast.error(result.error);
            }
        }
        setIsDelegating(false);
    }, [address, delegateAddress, delegateVote, refetchVotingPower, queryClient]);

    // Handle manual refresh
    const handleRefresh = useCallback(async () => {
        await Promise.all([refetchProposals(), refetchVotingPower()]);
    }, [refetchProposals, refetchVotingPower]);

    // Handle execute proposal
    const handleExecuteProposal = useCallback(async (proposalId: number) => {
        const result = await executeProposal(proposalId);
        if (result.success) {
            // Defer query invalidation to avoid setState during render
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['governance', 'proposals'] });
                refetchProposals();
            }, 0);
        }
    }, [executeProposal, refetchProposals, queryClient]);

    return (
        <div className="min-h-screen bg-white pb-20 font-sans selection:bg-yellow-300 selection:text-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* 1. HERO SECTION */}
            <section className="pt-16 pb-12 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="inline-block bg-black text-white px-3 py-1 text-sm font-bold font-mono transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)]">
                            BLOCKCHAIN DAO
                        </div>
                        <div className="inline-flex items-center gap-1 bg-green-100 border-2 border-black px-3 py-1 text-sm font-bold">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            LIVE GOVERNANCE
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 leading-none">
                        Governance <br /> Dashboard
                    </h1>
                    <p className="text-xl font-medium text-neutral-800 max-w-2xl mx-auto border-l-4 border-black pl-4 text-left md:text-center md:border-none md:pl-0">
                        Participate in shaping the future of academic publishing. <br className="hidden md:inline" /> Your <span className="font-bold bg-yellow-300 px-1">USDC Balance</span> determines your voting weight.
                    </p>
                </div>
            </section>

            {/* 2. STATS OVERVIEW */}
            <section className="container mx-auto px-4 mb-16 relative z-10">
                <div className="grid md:grid-cols-4 gap-6">
                    {[
                        { label: "Active Proposals", value: stats.activeProposals.toString(), icon: Vote, bg: "bg-purple-100 group-hover:bg-purple-300" },
                        { label: "Total Proposals", value: stats.totalProposals.toString(), icon: FileText, bg: "bg-blue-100 group-hover:bg-blue-300" },
                        { label: "Your Voting Power", value: `${Number(stats.votingPower) / 1e6}M`, icon: Coins, bg: "bg-yellow-100 group-hover:bg-yellow-300" },
                        { label: "Wallet Status", value: stats.isConnected ? "Connected" : "Disconnected", icon: CheckCircle2, bg: stats.isConnected ? "bg-green-100 group-hover:bg-green-300" : "bg-red-100 group-hover:bg-red-300" }
                    ].map((stat, i) => (
                        <div key={stat.label} className={`p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white group hover:-translate-y-1 transition-all duration-200`}>
                            <div className={`w-12 h-12 flex items-center justify-center border-2 border-black mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-colors ${stat.bg}`}>
                                <stat.icon className="h-6 w-6 text-black" />
                            </div>
                            <div className="text-4xl font-black font-mono tracking-tighter mb-1">{stat.value}</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-neutral-600">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. MAIN CONTENT LAYOUT */}
            <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-8">

                {/* LEFT COL: PROPOSAL LIST */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Controls */}
                    <div className="flex flex-col gap-6">

                        {/* Tabs & Search */}
                        <div className="bg-neutral-100 p-4 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 justify-between items-center">
                            <Tabs defaultValue="active" className="w-full md:w-auto" onValueChange={setActiveTab}>
                                <TabsList className="bg-transparent gap-2 p-0 h-auto flex-wrap justify-start">
                                    {["active", "passed", "rejected", "all"].map((tab) => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            className="
                                h-10 px-4 border-2 border-transparent rounded-none font-bold uppercase
                                data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:shadow-[3px_3px_0px_0px_rgba(128,128,128,0.5)]
                                hover:border-black hover:bg-white transition-all
                            "
                                        >
                                            {tab === "active" && isRefetchingProposals && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                                            {tab}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            <div className="relative w-full md:w-[250px] group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
                                <Input
                                    type="search"
                                    placeholder="SEARCH PROPOSALS..."
                                    className="pl-10 h-10 bg-white border-2 border-black rounded-none font-bold placeholder:text-neutral-500 focus-visible:ring-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all text-black uppercase"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Refresh Button */}
                            <Button
                                onClick={handleRefresh}
                                disabled={isInitialLoad}
                                className="h-10 px-4 bg-white text-black border-2 border-black rounded-none font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                            >
                                {isRefetchingProposals ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>

                        {/* DIALOG CREATE PROPOSAL */}
                        <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                            <DialogContent className="sm:max-w-[500px] border-2 border-black rounded-none bg-white p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <DialogHeader className="p-6 border-b-2 border-black bg-yellow-300">
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <Megaphone className="h-6 w-6" /> New Proposal
                                    </DialogTitle>
                                    <DialogDescription className="text-black font-bold opacity-80">
                                        Submit a proposal for community voting. Requires USDC for voting power.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-6 p-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title" className="font-bold uppercase">Proposal Title</Label>
                                        <Input id="title" className="border-2 border-black rounded-none h-12 font-bold focus-visible:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]" placeholder="E.G. GRANT FOR BLOCKCHAIN RESEARCH..." value={newProp.title} onChange={(e) => setNewProp({ ...newProp, title: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="category" className="font-bold uppercase">Category</Label>
                                        <Select onValueChange={(val) => setNewProp({ ...newProp, type: val })}>
                                            <SelectTrigger className="border-2 border-black rounded-none h-12 font-bold focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                                <SelectValue placeholder="SELECT CATEGORY" />
                                            </SelectTrigger>
                                            <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                <SelectItem value="0" className="font-bold focus:bg-yellow-200 focus:text-black">NEW JOURNAL</SelectItem>
                                                <SelectItem value="1" className="font-bold focus:bg-yellow-200 focus:text-black">REVIEWER NOMINATION</SelectItem>
                                                <SelectItem value="2" className="font-bold focus:bg-yellow-200 focus:text-black">TREASURY/GRANT</SelectItem>
                                                <SelectItem value="3" className="font-bold focus:bg-yellow-200 focus:text-black">PROTOCOL POLICY</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="desc" className="font-bold uppercase">Description</Label>
                                        <Textarea id="desc" placeholder="Explain your proposal clearly..." className="min-h-[100px] border-2 border-black rounded-none font-medium focus-visible:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]" value={newProp.desc} onChange={(e) => setNewProp({ ...newProp, desc: e.target.value })} />
                                    </div>
                                </div>

                                <DialogFooter className="p-6 pt-0">
                                    <Button type="submit" onClick={handleSubmitProposal} disabled={isCreating} className="w-full h-12 bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} {isCreating ? "SUBMITTING..." : "SUBMIT ON-CHAIN"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </div>

                    {/* Loading State (only for initial load) */}
                    {isInitialLoad ? (
                        <div className="flex flex-col items-center justify-center py-24 border-4 border-black border-dashed bg-neutral-50">
                            <Loader2 className="h-12 w-12 animate-spin text-black mb-4" />
                            <p className="font-bold text-lg uppercase animate-pulse">Loading from Arbitrum Sepolia...</p>
                            <p className="text-sm text-neutral-500 mt-2">Fetching governance proposals from smart contract</p>
                        </div>
                    ) : (
                        <>
                            {/* Proposal Cards */}
                            {filteredProposals.length > 0 ? filteredProposals.map((proposal) => {
                                const StatusIcon = statusConfig[proposal.status].icon;
                                // Use the indexer's calculateVotingStats for accurate data
                                const stats = calculateVotingStats(proposal);

                                return (
                                    <Card key={proposal.id.toString()} className="group relative border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden hover:-translate-y-1 transition-transform duration-200">

                                        <div className="p-6 md:p-8 space-y-6">

                                            {/* Header */}
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="space-y-3 flex-1">
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <Badge variant="outline" className={`${typeConfig[proposal.proposalType].color} rounded-none border-2 px-2 py-0.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                                            {typeConfig[proposal.proposalType].label}
                                                        </Badge>
                                                        <Badge variant="outline" className={`${statusConfig[proposal.status].color} rounded-none border-2 px-2 py-0.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" /> {statusConfig[proposal.status].label}
                                                        </Badge>
                                                        <span className="text-xs font-mono font-bold border border-black px-1 py-0.5 bg-neutral-100">
                                                            #{proposal.id.toString().padStart(3, '0')}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-2xl font-black uppercase leading-tight group-hover:underline decoration-4 underline-offset-4 cursor-pointer">{proposal.title}</h4>
                                                    <p className="text-base font-medium text-neutral-600 leading-relaxed border-l-4 border-neutral-300 pl-3">
                                                        {proposal.description}
                                                    </p>
                                                </div>

                                                {stats.isActive && (
                                                    <div className="flex-shrink-0 text-center border-2 border-black bg-white p-2 min-w-[100px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                        <div className="text-[10px] font-bold uppercase border-b border-black pb-1 mb-1">Time Left</div>
                                                        <div className="text-xl font-black font-mono text-red-600">{stats.timeLeftDisplay}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress Bars (Custom Brutalist) */}
                                            <div className="grid sm:grid-cols-2 gap-8 border-t-2 border-black pt-6 border-dashed">

                                                {/* Support Bar */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-black uppercase">
                                                        <span className="text-neutral-500">Current Support</span>
                                                        <span>{stats.votePercentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-4 w-full border-2 border-black bg-white relative">
                                                        <div className="absolute top-0 left-0 h-full bg-green-500 border-r-2 border-black" style={{ width: `${stats.votePercentage}%` }} />
                                                    </div>
                                                </div>

                                                {/* Quorum Bar */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-black uppercase">
                                                        <span className="text-neutral-500">Quorum Progress</span>
                                                        <span>{stats.quorumPercentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-4 w-full border-2 border-black bg-white relative">
                                                        <div className="absolute top-0 left-0 h-full bg-blue-500 border-r-2 border-black" style={{ width: `${stats.quorumPercentage}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Action */}
                                            {stats.isActive && (
                                                <div className="bg-neutral-50 border-t-2 border-black p-4 flex justify-between items-center">
                                                    <div className="text-sm font-bold text-neutral-600">
                                                        <div>{stats.votesFor.toLocaleString()} FOR</div>
                                                        <div>{stats.votesAgainst.toLocaleString()} AGAINST</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleVote(Number(proposal.id), false)}
                                                            disabled={isVoting || !address}
                                                            className="h-10 bg-red-500 text-white border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)] hover:bg-red-600 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.5)] transition-all"
                                                        >
                                                            {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleVote(Number(proposal.id), true)}
                                                            disabled={isVoting || !address}
                                                            className="h-10 bg-green-500 text-white border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(34,197,94,0.3)] hover:bg-green-600 hover:shadow-[4px_4px_0px_0px_rgba(34,197,94,0.5)] transition-all"
                                                        >
                                                            {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Execute Action for Passed Proposals */}
                                            {proposal.status === ProposalStatus.Passed && (
                                                <div className="bg-green-100 border-t-2 border-black p-4">
                                                    <Button
                                                        onClick={() => handleExecuteProposal(Number(proposal.id))}
                                                        disabled={!address}
                                                        className="w-full h-10 bg-green-600 text-white border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(22,163,74,0.3)] hover:bg-green-700 hover:shadow-[4px_4px_0px_0px_rgba(22,163,74,0.5)] transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                        EXECUTE PROPOSAL
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            }) : (
                                <div className="text-center py-20 border-4 border-black border-dashed bg-neutral-50">
                                    <FileText className="h-16 w-16 mx-auto mb-4 text-black" />
                                    <p className="font-bold text-lg uppercase">No Proposals Found</p>
                                    <p className="text-sm text-neutral-500 mt-2">Create a proposal to get started!</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* RIGHT COL: SIDEBAR */}
                <div className="space-y-8">

                    {/* Action Card */}
                    <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-yellow-300 p-0 overflow-hidden">
                        <div className="p-6 border-b-2 border-black bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-black uppercase text-lg">My Voting Power</h3>
                                <Vote className="h-6 w-6 text-black" />
                            </div>
                            <div className="text-5xl font-black text-black font-mono mb-2">{Number(stats.votingPower) / 1e6}M <span className="text-lg font-bold">VP</span></div>
                            <div className="text-xs font-bold text-neutral-600 uppercase border border-black p-2 bg-neutral-100 inline-block">
                                {stats.isConnected ? "CONNECTED" : "CONNECT WALLET TO VOTE"}
                            </div>
                        </div>

                        <div className="p-6 bg-yellow-300">
                            <Button className="w-full h-12 bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all mb-3" onClick={() => setProposalOpen(true)} disabled={!address}>
                                <Plus className="w-5 h-5 mr-2" /> CREATE PROPOSAL
                            </Button>
                            <p className="text-[10px] text-center font-bold uppercase tracking-widest">
                                REQUIRES USDC FOR VOTING POWER
                            </p>
                        </div>
                    </Card>

                    {/* Delegation Card */}
                    <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6">
                        <h3 className="font-black uppercase mb-6 flex items-center gap-2 text-lg border-b-2 border-black pb-2">
                            <UserCheck className="h-5 w-5" /> Top Delegates
                        </h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={`delegate-${i}`} className="flex items-center justify-between group p-2 border-2 border-transparent hover:border-black hover:bg-neutral-50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-black rounded-none bg-blue-100">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}`} />
                                            <AvatarFallback className="font-bold text-black rounded-none">D{i}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-bold uppercase group-hover:underline decoration-2">Expert Reviewer {i}</div>
                                            <div className="text-xs font-mono font-medium text-neutral-500">SINTA 1 • 45k VP</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-black hover:text-white rounded-none border border-black" onClick={() => setDelegateAddress(`0xExpert${i}`)}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Separator className="my-6 bg-black h-0.5" />

                        {/* DIALOG DELEGASI */}
                        <Dialog open={delegationOpen} onOpenChange={setDelegationOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full h-12 bg-white text-black border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    MANAGE DELEGATION
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] border-2 border-black rounded-none p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                                <DialogHeader className="p-6 border-b-2 border-black bg-blue-300">
                                    <DialogTitle className="text-2xl font-black uppercase">Delegate Voting Power</DialogTitle>
                                    <DialogDescription className="text-black font-bold opacity-80">
                                        Select a trusted expert to vote on your behalf.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-6 p-6">
                                    <div className="space-y-2">
                                        <Label className="font-bold uppercase">Delegate Address</Label>
                                        <div className="flex gap-0">
                                            <Input placeholder="0x..." className="border-2 border-black border-r-0 rounded-none h-12 font-mono font-bold focus-visible:ring-0" value={delegateAddress} onChange={(e) => setDelegateAddress(e.target.value)} />
                                            <Button variant="ghost" size="icon" className="h-12 w-12 border-2 border-black rounded-none bg-neutral-100 hover:bg-black hover:text-white" onClick={() => {
                                                navigator.clipboard.writeText(delegateAddress);
                                                toast.success("Address copied to clipboard");
                                            }}>
                                                <Copy className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="bg-yellow-100 border-2 border-black p-4 text-xs font-bold flex gap-3 items-start shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                        <ShieldCheck className="h-5 w-5 shrink-0" />
                                        <div>DELEGATION DOES NOT TRANSFER TOKEN OWNERSHIP. YOU RETAIN FULL CUSTODY.</div>
                                    </div>
                                </div>

                                <DialogFooter className="p-6 pt-0">
                                    <Button 
                                        type="submit" 
                                        onClick={handleDelegate} 
                                        disabled={isDelegating || !delegateAddress}
                                        className="w-full h-12 bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDelegating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                PROCESSING...
                                            </>
                                        ) : (
                                            "CONFIRM DELEGATION"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Card>
                </div>
            </div>
        </div>
    );
}
