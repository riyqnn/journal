import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Users, Coins, Clock, CheckCircle2, XCircle, Megaphone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Proposal {
  id: number;
  title: string;
  description: string;
  type: "journal" | "reviewer" | "treasury" | "policy";
  status: "active" | "passed" | "rejected";
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  timeLeft: string;
  requiredVotes: number;
}

const mockProposals: Proposal[] = [
  {
    id: 1,
    title: "Create New Journal: Blockchain in Education",
    description: "Proposal to establish a dedicated journal for blockchain applications in educational technology and administration.",
    type: "journal",
    status: "active",
    votesFor: 1247,
    votesAgainst: 328,
    totalVotes: 1575,
    timeLeft: "5 DAYS",
    requiredVotes: 2000,
  },
  {
    id: 2,
    title: "Reviewer Admission: Dr. Sarah Chen",
    description: "Nomination of Dr. Sarah Chen (SINTA 1, Stanford University) as senior reviewer for AI/ML papers.",
    type: "reviewer",
    status: "active",
    votesFor: 892,
    votesAgainst: 156,
    totalVotes: 1048,
    timeLeft: "2 DAYS",
    requiredVotes: 1500,
  },
  {
    id: 3,
    title: "Treasury Allocation: Early Researcher Grants",
    description: "Allocate 50,000 IP tokens for grants supporting SINTA 4-5 researchers in their first publications.",
    type: "treasury",
    status: "passed",
    votesFor: 2341,
    votesAgainst: 289,
    totalVotes: 2630,
    timeLeft: "CLOSED",
    requiredVotes: 2000,
  },
];

// Config dengan style Neo-Brutalist (Solid colors, black borders)
const typeConfig = {
  journal: { label: "JOURNAL", color: "bg-blue-300 text-black border-black" },
  reviewer: { label: "REVIEWER", color: "bg-purple-300 text-black border-black" },
  treasury: { label: "TREASURY", color: "bg-yellow-300 text-black border-black" },
  policy: { label: "POLICY", color: "bg-slate-300 text-black border-black" },
};

const statusConfig = {
  active: { label: "VOTING ACTIVE", icon: Clock, color: "bg-green-300 text-black border-black" },
  passed: { label: "PASSED", icon: CheckCircle2, color: "bg-blue-300 text-black border-black" },
  rejected: { label: "REJECTED", icon: XCircle, color: "bg-red-300 text-black border-black" },
};

export const GovernanceDashboard = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-white border-black font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="container px-4 mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block bg-black text-white px-3 py-1 text-sm font-bold font-mono mb-4 transform -rotate-2">
            DAO CONTROL CENTER
          </div>
          <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter leading-none">
            Governance <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 px-2" >
              Consensus
            </span>
          </h2>
          <p className="text-xl font-medium text-neutral-800 border-l-4 border-black pl-4 text-left md:text-center md:border-none md:pl-0">
            Shape the future of academic publishing. Your <span className="font-bold bg-yellow-300 px-1 border-black">IP Tokens</span> represent your voting power.
          </p>
        </div>

        {/* Stats Cards - Brutalist Boxes */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Active Voters", value: "2,847", icon: Users, bg: "bg-blue-100" },
            { label: "Active Proposals", value: "23", icon: Vote, bg: "bg-purple-100" },
            { label: "Treasury (IP)", value: "125,000", icon: Coins, bg: "bg-yellow-100" },
            { label: "Participation", value: "89%", icon: CheckCircle2, bg: "bg-green-100" },
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
          {mockProposals.map((proposal) => {
            const StatusIcon = statusConfig[proposal.status].icon;
            const votePercentage = (proposal.votesFor / proposal.totalVotes) * 100;
            const participationPercentage = (proposal.totalVotes / proposal.requiredVotes) * 100;

            return (
              <Card key={proposal.id} className="relative p-0 border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
                
                {/* Proposal Content */}
                <div className="p-6 md:p-8">
                  {/* Header: Title & Badges */}
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={`${typeConfig[proposal.type].color} rounded-none border-2 px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                          {typeConfig[proposal.type].label}
                        </Badge>
                        <Badge variant="outline" className={`${statusConfig[proposal.status].color} rounded-none border-2 px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                          <StatusIcon className="w-3 h-3 mr-2" /> {statusConfig[proposal.status].label}
                        </Badge>
                      </div>
                      <h4 className="text-2xl font-black leading-tight uppercase">{proposal.title}</h4>
                      <p className="text-lg font-medium text-neutral-600 max-w-3xl">{proposal.description}</p>
                    </div>

                    {/* Timer Box */}
                    <div className="min-w-[140px] border-2 border-black bg-neutral-100 p-2 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-xs font-bold uppercase border-b border-black pb-1 mb-1">Time Left</div>
                      <div className="text-2xl font-black font-mono text-red-600">{proposal.timeLeft}</div>
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
                          style={{ width: `${votePercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-mono font-medium text-neutral-500">
                        <span>0%</span>
                        <span>{proposal.votesFor.toLocaleString()} / {proposal.totalVotes.toLocaleString()} VOTES</span>
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
                          style={{ width: `${participationPercentage}%` }}
                        />
                        {/* Threshold Marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 left-[75%] z-10"></div>
                      </div>
                      <div className="flex justify-between text-xs font-mono font-medium text-neutral-500">
                        <span>TARGET: 75%</span>
                        <span>{proposal.totalVotes.toLocaleString()} / {proposal.requiredVotes.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions (Vote Buttons) */}
                {proposal.status === "active" && (
                  <div className="bg-neutral-100 p-4 border-t-2 border-black flex flex-col sm:flex-row gap-4 justify-between items-center">
                    
                    {/* Vote Breakdown Display */}
                    <div className="flex gap-6 font-mono text-sm font-bold">
                        <div className="flex items-center text-green-700">
                            <span className="w-3 h-3 bg-green-500 border border-black mr-2"></span>
                            FOR: {proposal.votesFor}
                        </div>
                        <div className="flex items-center text-red-700">
                            <span className="w-3 h-3 bg-red-500 border border-black mr-2"></span>
                            AGAINST: {proposal.votesAgainst}
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
          })}
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