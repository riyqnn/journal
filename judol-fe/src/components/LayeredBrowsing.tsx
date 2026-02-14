import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaperCard } from "./PaperCard";
import { Search, Filter, CheckCircle2, Bot, Database, ArrowRight, RefreshCw } from "lucide-react";
import { PaperStatus, PaperMetadata } from "@/hooks/useContract";
import { usePapersByStatus } from "@/hooks/useContractQuery";
import { formatDistanceToNow } from "date-fns";

export const LayeredBrowsing = () => {
  const [searchQuery, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Use React Query for each status type - auto-refreshes in background
  const { data: verifiedPapers = [], isLoading: isLoadingVerified, refetch: refetchVerified } = usePapersByStatus(PaperStatus.Verified);
  const { data: processingPapers = [], isLoading: isLoadingProcessing, refetch: refetchProcessing } = usePapersByStatus(PaperStatus.Draft);
  const { data: dataPoolPapers = [], isLoading: isLoadingDataPool, refetch: refetchDataPool } = usePapersByStatus(PaperStatus.DataPool);

  const [isRefetching, setIsRefetching] = useState(false);

  // Manual refresh function that refreshes all queries in background
  const handleRefreshAll = async () => {
    setIsRefetching(true);
    try {
      await Promise.all([
        refetchVerified(),
        refetchProcessing(),
        refetchDataPool()
      ]);
    } finally {
      setTimeout(() => setIsRefetching(false), 500); // Brief spin animation
    }
  };

  // Calculate stats from real data
  const layerStats = useMemo(() => ({
    verified: verifiedPapers.length,
    processing: processingPapers.length,
    data_pool: dataPoolPapers.length
  }), [verifiedPapers, processingPapers, dataPoolPapers]);

  // Filter papers based on search and category (memoized)
  const filteredPapers = useMemo(() => {
    const filterFn = (papers: PaperMetadata[]) => {
      return papers.filter(paper => {
        const matchesSearch = !searchQuery || (
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.author.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const matchesCategory = selectedCategory === "all" || true; // TODO: add category filtering
        return matchesSearch && matchesCategory;
      });
    };

    return {
      verified: filterFn(verifiedPapers).slice(0, 3),
      processing: filterFn(processingPapers).slice(0, 3),
      data_pool: filterFn(dataPoolPapers).slice(0, 3),
    };
  }, [verifiedPapers, processingPapers, dataPoolPapers, searchQuery, selectedCategory]);

  const renderPaperCard = (paper: PaperMetadata) => {
    const cardProps = {
      title: paper.title.toUpperCase(),
      abstract: `Research paper from blockchain. Minted: ${formatDistanceToNow(new Date(paper.mintedAt), { addSuffix: true })}`,
      authors: [{ name: paper.author, sintaLevel: 0 }],
      status: paper.status.toLowerCase() as 'verified' | 'processing' | 'data_pool',
      submitDate: formatDistanceToNow(new Date(paper.mintedAt), { addSuffix: true }),
      category: "Blockchain Research",
      views: Math.floor(Math.random() * 1000),
      downloads: Math.floor(Math.random() * 500),
      royaltyShare: "0%",
      aiScore: Math.floor(Math.random() * 20) + 80,
      licenseType: "Commercial (PIL)"
    };

    return (
      <Link to={`/asset/${paper.tokenId}`} key={paper.tokenId} className="block group">
        <PaperCard {...cardProps} />
      </Link>
    );
  };

  // Initial loading state (only shows once on mount)
  const isInitialLoad = isLoadingVerified && isLoadingProcessing && isLoadingDataPool;

  return (
    <section className="relative py-20 bg-white border-black min-h-[800px]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 px-4 mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b-2 border-black pb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-sm font-bold font-mono mb-4">
              <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} /> LIVE BLOCKCHAIN DATA
            </div>
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Knowledge Graph</h2>
            <p className="text-lg font-medium text-neutral-700 max-w-2xl">
              Discover real-time IP, track works in progress, or access raw data from Arbitrum.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-green-400 text-black border-2 border-black p-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm flex items-center gap-2 cursor-pointer hover:bg-green-500 transition-colors" onClick={handleRefreshAll}>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              {isRefetching ? 'REFRESHING...' : 'SYNC ACTIVE'}
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-neutral-100 p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black pointer-events-none">
                <Search className="h-5 w-5" />
              </div>
              <Input
                placeholder="SEARCH IP ASSETS..."
                className="pl-12 h-14 bg-white border-2 border-black rounded-none text-lg placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-medium text-black"
                value={searchQuery}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px] h-14 bg-white border-2 border-black rounded-none font-bold text-black focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <SelectValue placeholder="CATEGORY" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="blockchain">Blockchain</SelectItem>
                  <SelectItem value="ai">AI & Data</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-14 px-8 bg-white text-black border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all">
                <Filter className="w-5 h-5 mr-2" /> FILTER
              </Button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="verified" className="w-full">
          <TabsList className="w-full h-auto bg-transparent p-0 gap-4 flex flex-col md:flex-row justify-start mb-8">
            <TabsTrigger value="verified" className="group h-14 px-6 border-2 border-black rounded-none text-base font-bold flex-1 md:flex-none justify-start text-black bg-white data-[state=active]:bg-yellow-300 data-[state=active]:text-black data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] data-[state=active]:translate-y-[-4px] transition-all">
              <CheckCircle2 className="w-5 h-5 mr-2" /> VERIFIED IP <Badge variant="secondary" className="ml-auto md:ml-2 bg-black text-white rounded-none border border-transparent">{layerStats.verified}</Badge>
            </TabsTrigger>
            <TabsTrigger value="processing" className="group h-14 px-6 border-2 border-black rounded-none text-base font-bold flex-1 md:flex-none justify-start text-black bg-white data-[state=active]:bg-yellow-300 data-[state=active]:text-black data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] data-[state=active]:translate-y-[-4px] transition-all">
              <Bot className="w-5 h-5 mr-2" /> AI PROCESSING <Badge variant="secondary" className="ml-auto md:ml-2 bg-black text-white rounded-none border border-transparent">{layerStats.processing}</Badge>
            </TabsTrigger>
            <TabsTrigger value="data_pool" className="group h-14 px-6 border-2 border-black rounded-none text-base font-bold flex-1 md:flex-none justify-start text-black bg-white data-[state=active]:bg-yellow-300 data-[state=active]:text-black data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] data-[state=active]:translate-y-[-4px] transition-all">
              <Database className="w-5 h-5 mr-2" /> DATA POOL <Badge variant="secondary" className="ml-auto md:ml-2 bg-black text-white rounded-none border border-transparent">{layerStats.data_pool}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="min-h-[400px]">
            {isInitialLoad ? (
              <div className="flex flex-col items-center justify-center h-64 border-4 border-black border-dashed bg-neutral-50">
                <RefreshCw className="h-12 w-12 animate-spin text-black mb-4" />
                <p className="font-bold text-lg uppercase animate-pulse">Loading from blockchain...</p>
                <p className="text-sm text-neutral-500 mt-2">Fetching from Arbitrum Sepolia</p>
              </div>
            ) : (
              <>
                <TabsContent value="verified" className="space-y-6 mt-0">
                  {filteredPapers.verified.length > 0 ? (
                    <div className="grid gap-6">
                      {filteredPapers.verified.map(renderPaperCard)}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-4 border-black border-dashed bg-neutral-50">
                      <Database className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                      <h3 className="text-2xl font-black uppercase mb-2">No Verified Assets Found</h3>
                      <p className="text-neutral-600">There are no verified papers on the blockchain yet.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="processing" className="space-y-6 mt-0">
                  {filteredPapers.processing.length > 0 ? (
                    <div className="grid gap-6">
                      {filteredPapers.processing.map(renderPaperCard)}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-4 border-black border-dashed bg-neutral-50">
                      <Bot className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                      <h3 className="text-2xl font-black uppercase mb-2">No Pending Submissions</h3>
                      <p className="text-neutral-600">There are no papers waiting for AI processing.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="data_pool" className="space-y-6 mt-0">
                  {filteredPapers.data_pool.length > 0 ? (
                    <div className="grid gap-6">
                      {filteredPapers.data_pool.map(renderPaperCard)}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-4 border-black border-dashed bg-neutral-50">
                      <Database className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                      <h3 className="text-2xl font-black uppercase mb-2">Data Pool is Empty</h3>
                      <p className="text-neutral-600">There are no papers in the data pool yet.</p>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        <div className="mt-12 text-center">
          <Button onClick={() => window.location.href = '/explore'} variant="link" className="text-black font-bold underline decoration-2 underline-offset-4 hover:bg-yellow-300">
            VIEW ALL ASSETS <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

      </div>
    </section>
  );
};
