import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Users, Coins, Clock, CheckCircle2, XCircle, Megaphone, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGovernanceProposals } from "@/hooks/useGovernanceIndexer";
import { useGovernanceStats } from "@/hooks/useContractQuery";
import { ProposalType, ProposalStatus } from "@/hooks/useGovernance";

// Config dengan style Neo-Brutalist (Solid colors, black borders)
const typeConfig = {
  [ProposalType.Journal]: { label: "JOURNAL", color: "bg-blue-300 text-black border-black" },
  [ProposalType.Reviewer]: { label: "REVIEWER", color: "bg-purple-300 text-black border-black" },
  [ProposalType.Treasury]: { label: "TREASURY", color: "bg-yellow-300 text-black border-black" },
  [ProposalType.Policy]: { label: "POLICY", color: "bg-slate-300 text-black border-black" },
};

const statusConfig = {
  [ProposalStatus.Active]: { label: "VOTING ACTIVE", icon: Clock, color: "bg-green-300 text-black border-black" },
  [ProposalStatus.Passed]: { label: "PASSED", icon: CheckCircle2, color: "bg-blue-300 text-black border-black" },
  [ProposalStatus.Rejected]: { label: "REJECTED", icon: XCircle, color: "bg-red-300 text-black border-black" },
  [ProposalStatus.Executed]: { label: "EXECUTED", icon: CheckCircle2, color: "bg-purple-300 text-black border-black" },
};

// Helper function to calculate time left
const getTimeLeft = (endTime: bigint): string => {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTime);
  const diff = end - now;

  if (diff <= 0) return "CLOSED";

  const days = Math.floor(diff / (24 * 60 * 60));
  const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));

  if (days > 0) return `${days} DAYS`;
  if (hours > 0) return `${hours} HOURS`;
  return "< 1 HOUR";
};

export const GovernanceDashboard = () => {
  const navigate = useNavigate();
  const { data: proposals = [], isLoading, error } = useGovernanceProposals();
  const { data: stats, isLoading: statsLoading } = useGovernanceStats();

  // Default stats in case data is not loaded yet
  const displayStats = stats || {
    activeProposals: 0,
    activeVoters: 0,
    treasury: "125K",
    participation: "0%",
  };

  return (
    <section className="py-20 bg-white border-black font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="container px-4 mx-auto">

        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block bg-black text-white px-3 py-1 text-sm font-bold font-mono mb-4 transform -rotate-2 flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin" /> DAO CONTROL CENTER
          </div>
          <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter leading-none">
            Governance <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 px-2" >
              Consensus
            </span>
          </h2>
          <p className="text-xl font-medium text-neutral-800 border-l-4 border-black pl-4 text-left md:text-center md:border-none md:pl-0">
            Shape the future of academic publishing. Your <span className="font-bold bg-yellow-300 px-1 border-black">USDC balance</span> represents your voting power.
          </p>
        </div>

        {/* Stats Cards - Brutalist Boxes */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Active Voters", value: displayStats.activeVoters.toLocaleString(), icon: Users, bg: "bg-blue-100" },
            { label: "Active Proposals", value: displayStats.activeProposals.toString(), icon: Vote, bg: "bg-purple-100" },
            { label: "Treasury (USDC)", value: displayStats.treasury, icon: Coins, bg: "bg-yellow-100" },
            { label: "Participation", value: displayStats.participation, icon: CheckCircle2, bg: "bg-green-100" },
          ].map((stat, idx) => (
            <div key={idx} className={`p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${stat.bg}`}>
              <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                <stat.icon className="h-6 w-6 text-black" />
                <span className="font-bold text-xs uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="text-4xl font-black font-mono tracking-tighter">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Proposals Header */}
        <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4 border-b-4 border-black pb-4">
          <h3 className="text-3xl font-black uppercase flex items-center">
            <Megaphone className="mr-3 h-8 w-8" />
            Live Proposals
            {isLoading && <RefreshCw className="ml-4 h-6 w-6 animate-spin text-neutral-400" />}
          </h3>
          <Button
            onClick={() => navigate("/dao")}
            className="h-12 border-2 border-black bg-black text-white rounded-none font-bold hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Vote className="w-4 h-4 mr-2" /> SUBMIT PROPOSAL
          </Button>
        </div>

        {/* Proposals List */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 border-4 border-black border-dashed bg-neutral-50">
              <RefreshCw className="h-16 w-16 animate-spin text-black mb-4" />
              <p className="text-2xl font-black uppercase animate-pulse">Loading proposals...</p>
              <p className="text-sm text-neutral-500 mt-2">Fetching from Governance DAO contract</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 border-4 border-red-500 border-dashed bg-red-50">
              <p className="text-2xl font-black uppercase text-red-600">Failed to load proposals</p>
              <p className="text-sm text-neutral-500 mt-2">Please check your wallet connection</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-4 border-black border-dashed bg-neutral-50">
              <Megaphone className="h-16 w-16 text-neutral-400 mb-4" />
              <h3 className="text-2xl font-black uppercase mb-2">No Active Proposals</h3>
              <p className="text-neutral-600 mb-6">There are no active governance proposals at the moment.</p>
              <Button
                onClick={() => navigate("/dao")}
                className="h-12 px-8 bg-black text-white border-2 border-black rounded-none font-bold hover:bg-white hover:text-black transition-all"
              >
                Create First Proposal
              </Button>
            </div>
          ) : (
            proposals.map((proposal) => {
              const StatusIcon = statusConfig[proposal.status]?.icon || Clock;
              const votePercentage = Number(proposal.totalVotes) > 0
                ? (Number(proposal.votesFor) / Number(proposal.totalVotes)) * 100
                : 0;
              const participationPercentage = Number(proposal.requiredVotes) > 0
                ? (Number(proposal.totalVotes) / Number(proposal.requiredVotes)) * 100
                : 0;
              const timeLeft = getTimeLeft(proposal.endTime);

              return (
                <Card key={proposal.id.toString()} className="relative p-0 border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden group hover:-translate-y-1 transition-transform duration-200">

                  {/* Proposal Content */}
                  <div className="p-6 md:p-8">
                    {/* Header: Title & Badges */}
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={`${typeConfig[proposal.proposalType]?.color || 'bg-gray-300 text-black border-black'} rounded-none border-2 px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                            {typeConfig[proposal.proposalType]?.label || 'UNKNOWN'}
                          </Badge>
                          <Badge variant="outline" className={`${statusConfig[proposal.status]?.color || 'bg-gray-300 text-black border-black'} rounded-none border-2 px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                            <StatusIcon className="w-3 h-3 mr-2" /> {statusConfig[proposal.status]?.label || 'UNKNOWN'}
                          </Badge>
                        </div>
                        <h4 className="text-2xl font-black leading-tight uppercase">{proposal.title}</h4>
                        <p className="text-lg font-medium text-neutral-600 max-w-3xl">{proposal.description}</p>
                      </div>

                      {/* Timer Box */}
                      <div className="min-w-[140px] border-2 border-black bg-neutral-100 p-2 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs font-bold uppercase border-b border-black pb-1 mb-1">Time Left</div>
                        <div className="text-2xl font-black font-mono text-red-600">{timeLeft}</div>
                      </div>
                    </div>

                    {/* Progress Bars (Brutalist Style) */}
                    <div className="grid md:grid-cols-2 gap-8 py-6 border-t-2 border-dashed border-neutral-300">

                      {/* Support Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-bold uppercase">
                          <span>Current Support</span>
                          <span className="font-mono">{votePercentage.toFixed(1)}%</span>
                        </div>
                        {/* Custom Rectangular Progress Bar */}
                        <div className="h-6 w-full border-2 border-black bg-white relative">
                          <div
                            className="absolute top-0 left-0 h-full bg-green-500 border-r-2 border-black"
                            style={{ width: `${Math.min(votePercentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-mono font-medium text-neutral-500">
                          <span>0%</span>
                          <span>{Number(proposal.votesFor).toLocaleString()} / {Number(proposal.totalVotes).toLocaleString()} VOTES</span>
                        </div>
                      </div>

                      {/* Quorum Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-bold uppercase">
                          <span>Quorum Reached</span>
                          <span className="font-mono">{participationPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-6 w-full border-2 border-black bg-white relative">
                          <div
                            className="absolute top-0 left-0 h-full bg-blue-500 border-r-2 border-black"
                            style={{ width: `${Math.min(participationPercentage, 100)}%` }}
                          />
                          {/* Threshold Marker */}
                          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 left-[75%] z-10"></div>
                        </div>
                        <div className="flex justify-between text-xs font-mono font-medium text-neutral-500">
                          <span>TARGET: 75%</span>
                          <span>{Number(proposal.totalVotes).toLocaleString()} / {Number(proposal.requiredVotes).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions (Vote Buttons) */}
                  {proposal.status === ProposalStatus.Active && (
                    <div className="bg-neutral-100 p-4 border-t-2 border-black flex flex-col sm:flex-row gap-4 justify-between items-center">

                      {/* Vote Breakdown Display */}
                      <div className="flex gap-6 font-mono text-sm font-bold">
                        <div className="flex items-center text-green-700">
                          <span className="w-3 h-3 bg-green-500 border border-black mr-2"></span>
                          FOR: {Number(proposal.votesFor).toLocaleString()}
                        </div>
                        <div className="flex items-center text-red-700">
                          <span className="w-3 h-3 bg-red-500 border border-black mr-2"></span>
                          AGAINST: {Number(proposal.votesAgainst).toLocaleString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 w-full sm:w-auto">
                        <Button
                          onClick={() => navigate("/dao")}
                          className="flex-1 sm:flex-none border-2 border-black bg-white text-red-600 hover:bg-red-500 hover:text-white rounded-none font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                          VOTE AGAINST
                        </Button>
                        <Button
                          onClick={() => navigate("/dao")}
                          className="flex-1 sm:flex-none border-2 border-black bg-green-500 text-black hover:bg-green-400 rounded-none font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                          VOTE FOR
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Delegation Section - Brutalist Call to Action */}
        <div className="mt-20 border-4 border-black p-8 md:p-12 bg-yellow-300 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent bg-[size:20px_20px]" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter">Don't Waste Your Voting Power</h3>
            <p className="text-xl font-bold mb-8 leading-relaxed">
              Busy with research? Delegate your governance power to trusted <span className="underline decoration-4 decoration-black">Expert Nodes</span> (SINTA 1-2) to ensure academic integrity remains priority #1.
            </p>
            <Button
              variant="outline"
              className="h-14 px-10 text-xl border-4 border-black bg-white text-black rounded-none font-black hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              onClick={() => navigate("/dao")}
            >
              DELEGATE NOW <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
};
