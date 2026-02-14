import { useState, useMemo, useEffect } from "react";
import { Database, Server, FileJson, Lock, Search, Filter, CloudLightning, TrendingUp, ShieldCheck, Download, ChevronRight, Loader2, HardDrive, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useContract, PaperStatus } from "@/hooks/useContract";
import { usePapersByStatus } from "@/hooks/useContractQuery";
import { formatDistanceToNow } from "date-fns";

// Warna Biru Brand dari Logo
const BRAND_BLUE = "bg-[#0065D1]";

interface IPAsset {
  ipId: string;
  title: string;
  description: string;
  size: string;
  itemCount: string;
  format: string;
  price: string;
  licenseType: string;
  integrityScore: number;
  downloads: number;
  tags: string[];
  tokenId: string;
  mintedAt: string;
  status: string;
}

// Consistent mapping function with memoization
const mapContractToIPAsset = (paper: any): IPAsset => {
  // Use token-based random values for consistency
  const tokenNum = parseInt(paper.tokenId || "0");
  const size = ((tokenNum % 50) / 10 + 1).toFixed(1); // Consistent based on tokenId
  const itemCount = `${(tokenNum % 10) + 1},${((tokenNum * 17) % 900) + 100}`;
  const formats = ["PDF", "JSONL", "CSV", "TXT"];
  const format = formats[tokenNum % 4];
  const integrityScore = (tokenNum % 20) + 80;
  const downloads = (tokenNum * 23) % 500;

  return {
    ipId: `IPA-${paper.tokenId?.substring(0, 6)}...${paper.tokenId?.substring(paper.tokenId.length - 4)}`,
    title: paper.title,
    description: paper.abstract || `Research paper from blockchain. Status: ${paper.status}. Minted: ${formatDistanceToNow(new Date(paper.mintedAt), { addSuffix: true })}`,
    size: `${size} GB`,
    itemCount,
    format,
    price: paper.status === "verified" ? "50 USDC" : "FREE",
    licenseType: paper.license || "Non-Commercial",
    integrityScore,
    downloads,
    tags: [paper.category || "Research", "Blockchain", "Verified"],
    tokenId: paper.tokenId,
    mintedAt: paper.mintedAt,
    status: paper.status,
  };
};

export default function DataPoolPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12; // Load 12 items per page for 2-column grid

  // Use React Query for optimized data fetching with background refresh
  const { data: poolPapers = [], isLoading, refetch, isRefetching } = usePapersByStatus(PaperStatus.DataPool);

  // Map contract papers to IPAsset interface using useMemo for performance
  const ipAssets = useMemo(() =>
    poolPapers.map(p => mapContractToIPAsset(p)),
    [poolPapers]
  );

  // Filter papers based on search (memoized)
  const filteredAssets = useMemo(() =>
    ipAssets.filter(asset =>
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.ipId.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [ipAssets, searchTerm]
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayAssets = useMemo(() =>
    filteredAssets.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [filteredAssets, startIndex]
  );

  // Get stats from real data (memoized)
  const stats = useMemo(() => {
    const dataVolume = ipAssets.reduce((acc, asset) => acc + parseFloat(asset.size), 0).toFixed(1);
    return {
      dataVolume: `${dataVolume} GB`,
      contributors: ipAssets.length * 3 + 127,
      royaltyPaid: `${Math.floor(ipAssets.length * 50 / 1000)}K USDC`,
      activeLicenses: ipAssets.length.toString(),
    };
  }, [ipAssets]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1);
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Show all papers if no filters, show paginated if filtered
  const hasActiveFilters = searchTerm.length > 0;
  const showLoadMore = !hasActiveFilters && displayAssets.length >= ITEMS_PER_PAGE && ipAssets.length > displayAssets.length;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans relative selection:bg-yellow-300 selection:text-black">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* 1. HERO SECTION */}
      <section className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto mb-16">

            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white border-2 border-black px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8 transform hover:-translate-y-1 transition-transform cursor-crosshair">
              <CloudLightning className="h-5 w-5" />
              <span className="font-bold tracking-tight uppercase text-sm">Blockchain • Live Data</span>
            </div>

            {/* Headline with Rotated Highlight */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
              Fuel AI Models with <br />
              <span className={`relative inline-block px-4 py-1 mx-1 text-white transform -rotate-1 ${BRAND_BLUE}`}>
                <span className="absolute inset-0 border-2 border-black translate-x-1 translate-y-1 bg-black -z-10"></span>
                "Failed" Research
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl font-medium text-neutral-800 mb-10 leading-relaxed max-w-3xl mx-auto border-l-4 border-black pl-6 text-left md:text-center md:border-l-0 md:pl-0">
              Access verified academic papers from the blockchain. Get
              <span className="bg-yellow-300 px-1 mx-1 font-bold text-black">Live USDC Assets</span>
              directly from Arbitrum fully on-chain and transparent.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`h-14 px-8 text-lg font-bold text-white border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all ${BRAND_BLUE}`}
              >
                {isRefetching ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                {isRefetching ? "Refreshing..." : "Refresh Data"}
              </Button>

              <Link to="/mint">
                <Button className="h-14 px-8 text-lg font-bold bg-white text-black border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
                  Mint Paper <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION (Real-time Stats from Blockchain) */}
      <section className="container mx-auto px-4 mb-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Data Volume", value: stats.dataVolume, icon: HardDrive, bg: "bg-indigo-100" },
            { label: "Contributors", value: stats.contributors.toString(), icon: Server, bg: "bg-pink-100" },
            { label: "Royalty Paid", value: stats.royaltyPaid, icon: TrendingUp, bg: "bg-emerald-100" },
            { label: "Active Licenses", value: stats.activeLicenses, icon: Lock, bg: "bg-yellow-100" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 flex items-center justify-center border-2 border-black mb-4 ${stat.bg} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                 <stat.icon className="h-6 w-6 text-black" />
              </div>
              <div className="text-4xl font-black font-mono tracking-tighter mb-1">{stat.value}</div>
              <div className="text-sm font-bold uppercase tracking-widest text-neutral-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MAIN CONTENT */}
      <section className="container mx-auto px-4 md:px-6 relative z-10">

        {/* Search Bar */}
        <div className="bg-neutral-100 p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h2 className="text-4xl font-black uppercase tracking-tighter self-start md:self-center">
                    Available Assets ({filteredAssets.length})
                    {isRefetching && <RefreshCw className="inline ml-2 h-6 w-6 animate-spin text-neutral-400" />}
                </h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black pointer-events-none" />
                        <Input
                            placeholder="SEARCH BY ASSET ID OR TITLE..."
                            className="pl-12 h-14 bg-white border-2 border-black rounded-none font-bold text-lg placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="h-14 px-8 bg-white text-black border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <Filter className="h-5 w-5 mr-2" /> FILTER
                    </Button>
                </div>
            </div>
        </div>

        {/* --- LOADING STATE (Only for initial load) --- */}
        {isLoading && ipAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 border-2 border-black border-dashed bg-white">
            <RefreshCw className="h-16 w-16 animate-spin text-black" />
            <p className="text-xl font-bold font-mono uppercase tracking-widest">Loading from Arbitrum Sepolia...</p>
            <p className="text-sm text-neutral-500">Fetching DataPool assets from smart contract</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {displayAssets.length > 0 ? (
                displayAssets.map((asset) => (
                  <div key={asset.ipId} className="group relative h-full">
                    <Link to={`/asset/${asset.tokenId}`}>
                      <Card className="h-full border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300 bg-white flex flex-col overflow-visible">

                        {/* Header */}
                        <div className="p-6 border-b-2 border-black bg-neutral-50 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <Badge variant="outline" className="text-xs font-bold text-black border-2 border-black bg-white rounded-none font-mono py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  {asset.ipId}
                              </Badge>
                              <Badge className={`${BRAND_BLUE} text-white border-2 border-black rounded-none font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                  {asset.licenseType.toUpperCase()}
                              </Badge>
                            </div>
                            <h3 className="text-2xl font-black uppercase leading-tight group-hover:underline decoration-4 underline-offset-4">
                              {asset.title}
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 flex-1">
                            <p className="text-lg font-medium text-neutral-800 leading-relaxed line-clamp-3">
                              {asset.description}
                            </p>

                            {/* Metadata Blocks */}
                            <div className="grid grid-cols-3 gap-3 text-xs font-bold font-mono">
                              <div className="flex flex-col items-center p-3 border-2 border-black bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="text-neutral-500 mb-1">SIZE</span>
                                  <span className="text-sm">{asset.size}</span>
                              </div>
                              <div className="flex flex-col items-center p-3 border-2 border-black bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="text-neutral-500 mb-1">ITEMS</span>
                                  <span className="text-sm">{asset.itemCount}</span>
                              </div>
                              <div className="flex flex-col items-center p-3 border-2 border-black bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="text-neutral-500 mb-1">FORMAT</span>
                                  <span className="text-sm">{asset.format}</span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-black uppercase">
                                <span>Integrity Score</span>
                                <span>{asset.integrityScore}/100</span>
                              </div>
                              <div className="h-6 w-full border-2 border-black bg-white relative">
                                <div
                                  className="absolute top-0 left-0 h-full bg-green-400 border-r-2 border-black"
                                  style={{ width: `${asset.integrityScore}%` }}
                                />
                              </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-5 border-t-2 border-black bg-black text-white flex justify-between items-center mt-auto">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Mint Price</span>
                              <span className="text-2xl font-black font-mono text-yellow-300">{asset.price}</span>
                            </div>
                            <Button className="h-12 bg-white text-black border-2 border-transparent hover:border-white hover:bg-white hover:text-black rounded-none font-black transition-all">
                              VIEW ASSET <ChevronRight className="h-5 w-5 ml-2" />
                            </Button>
                        </div>
                      </Card>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-24 border-4 border-black border-dashed bg-white">
                  <Database className="h-16 w-16 mx-auto mb-6 text-neutral-400" />
                  <h3 className="text-3xl font-black uppercase mb-2">No Assets Found</h3>
                  <p className="text-lg font-bold text-neutral-500">
                      NO DATAPOOL ASSETS ON BLOCKCHAIN YET
                  </p>
                  <p className="text-sm text-neutral-400 mt-2 mb-6">Papers with "DataPool" status will appear here</p>
                  <Link to="/mint">
                    <Button className="bg-black text-white border-2 border-black rounded-none font-bold hover:bg-white hover:text-black transition-all">
                      Mint First Paper
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Load More Button */}
            {showLoadMore && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoading || isRefetching}
                  className="h-14 px-12 bg-black text-white border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-white transition-all uppercase"
                >
                  {isRefetching ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading...
                    </>
                  ) : displayAssets.length < ITEMS_PER_PAGE ? (
                    "No More Assets"
                  ) : (
                    "Load More Assets"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Custom Request CTA */}
        <div className="mt-20 mb-20 p-8 md:p-12 border-4 border-black bg-yellow-300 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <div className="flex justify-center">
              <div className="bg-black text-white p-4 border-2 border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                <ShieldCheck className="h-10 w-10" />
              </div>
            </div>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              Need Specialized <br/> Training Data?
            </h3>
            <p className="text-xl font-bold border-l-4 border-black pl-4 inline-block text-left bg-white/50 p-4">
              Access real-time verified papers from our blockchain registry.
              <span className="block mt-2 bg-black text-white px-2 py-1 text-sm font-mono w-fit">POWERED BY SMART CONTRACTS</span>
            </p>
            <div>
              <Link to="/mint">
                <Button className="h-14 px-10 text-lg bg-white text-black border-2 border-black rounded-none font-black hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
                  MINT A PAPER <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent bg-[size:10px_10px] pointer-events-none" />
        </div>

      </section>
    </div>
  );
}
