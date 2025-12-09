import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Wallet, FileText, TrendingUp, Settings,
    PlusCircle, ExternalLink,
    Clock, CheckCircle2, Copy, ShieldCheck, DollarSign, BarChart3
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAccount } from "wagmi"; // Import hook wagmi

// --- MOCK DATA ---
const MY_ASSETS = [
    {
        id: "IP-1024",
        title: "Optimizing ZK-Rollups for High Frequency Trading",
        type: "Research IP",
        status: "verified",
        license: "Commercial (PIL)",
        earnings: "450 IP",
        views: 2450,
        mintDate: "Nov 15, 2024",
    },
    {
        id: "IP-1025",
        title: "Dataset: Failed Algo-Trading Logs (Vol. 2)",
        type: "Data Asset",
        status: "verified",
        license: "Data-Only",
        earnings: "120 IP",
        views: 800,
        mintDate: "Nov 20, 2024",
    },
    {
        id: "IP-PENDING",
        title: "Analysis of DAO Governance Attacks",
        type: "Research IP",
        status: "processing",
        license: "Pending",
        earnings: "0 IP",
        views: 0,
        mintDate: "Just now",
    }
];

const RECENT_TRANSACTIONS = [
    { id: 1, action: "Royalty Payout", source: "Citation by Dr. Budi", amount: "+ 50 IP", date: "2 hours ago" },
    { id: 2, action: "License Purchased", source: "AI Training Corp", amount: "+ 200 IP", date: "1 day ago" },
    { id: 3, action: "Minting Fee", source: "Story Protocol", amount: "- 10 IP", date: "3 days ago" },
];

export default function DashboardPage() {
    const { address } = useAccount();
    
    const [copySuccess, setCopySuccess] = useState(false);
    const [assets, setAssets] = useState(MY_ASSETS);

    useEffect(() => {
        const localData = localStorage.getItem("myAssets");
        if (localData) {
            const parsedData = JSON.parse(localData);
            setAssets([...parsedData, ...MY_ASSETS]);
        }
    }, [])

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
                                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Total Earnings</span>
                                <span className="text-3xl font-black font-mono text-green-600">645 IP</span>
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
                                { label: "Total Assets", value: "12", icon: FileText, bg: "bg-blue-100" },
                                { label: "Total Citations", value: "89", icon: BarChart3, bg: "bg-purple-100" },
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
                                <CardDescription className="text-black font-medium">Manage your minted research papers and datasets recorded on Story Protocol.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y-2 divide-black">
                                    {assets.map((asset) => (
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
                                    <div className="text-5xl font-black font-mono mb-2 text-yellow-300">450.50 IP</div>
                                    <p className="text-neutral-500 font-bold font-mono text-sm">≈ $450.50 USD</p>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button className="w-full h-12 bg-white text-black border-2 border-white hover:bg-neutral-200 rounded-none font-black uppercase tracking-wide transition-all">
                                        <DollarSign className="w-4 h-4 mr-2" /> Withdraw to Wallet
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Recent Transactions */}
                            <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                                <CardHeader className="border-b-2 border-black bg-neutral-50">
                                    <CardTitle className="font-black uppercase tracking-tight">Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y-2 divide-black">
                                        {RECENT_TRANSACTIONS.map((tx) => (
                                            <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-neutral-50">
                                                <div>
                                                    <p className="font-bold text-sm uppercase">{tx.action}</p>
                                                    <p className="text-xs font-mono font-bold text-neutral-500 mt-1">{tx.source} • {tx.date}</p>
                                                </div>
                                                <span className={`font-black font-mono ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                                                    {tx.amount}
                                                </span>
                                            </div>
                                        ))}
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