import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Sparkles, Download, Eye, BookOpen, Database, ShieldCheck, Clock, FileKey, ArrowUpRight, FolderOpen, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContract, PaperMetadata } from "@/hooks/useContract";
import { useAllPapers } from "@/hooks/useContractQuery";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 6;

// Map contract data to Paper interface
const mapContractToPaper = (contract: PaperMetadata, index: number) => ({
  id: contract.tokenId,
  title: contract.title,
  author: contract.author,
  authorOrg: contract.affiliation || "Unknown Organization",
  abstract: `Research paper minted on blockchain. Status: ${contract.status}. Token ID: ${contract.tokenId}`,
  type: "Research" as const,
  license: "Commercial (PIL)",
  sinta: null, // Could be stored in metadata
  aiScore: Math.floor(Math.random() * 20) + 80, // Simulated score for now
  tierLabel: contract.status === "Verified" ? "Verified" : "Pending Review",
  mintDate: formatDistanceToNow(new Date(contract.mintedAt), { addSuffix: true }),
  views: Math.floor(Math.random() * 1000), // Simulated views
  downloads: Math.floor(Math.random() * 500), // Simulated downloads
  price: contract.status === "Verified" ? "50 USDC" : "-",
  status: contract.status.toLowerCase() as 'verified' | 'processing' | 'data_pool',
  category: "Blockchain Research",
  metadataUrl: contract.ipfsHash,
});

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [quickFilter, setQuickFilter] = useState<'none' | 'sinta1' | 'top_rated' | 'verified'>('none');
  const [currentPage, setCurrentPage] = useState(1);

  // Use React Query for optimized data fetching with caching
  const { data: contractPapers = [], isLoading, error, refetch } = useAllPapers(
    (currentPage - 1) * ITEMS_PER_PAGE,
    ITEMS_PER_PAGE
  );

  // Map contract data to Paper interface using useMemo for performance
  const papers = useMemo(() =>
    contractPapers.map((p, i) => mapContractToPaper(p, i)),
    [contractPapers]
  );

  // --- FILTER LOGIC ---
  const filteredPapers = papers.filter((paper) => {
    // 1. Text Search
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          paper.author.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Type Filter
    let matchesType = true;
    if (filterType === "research") matchesType = paper.type === "Research";
    if (filterType === "dataset") matchesType = paper.type === "Dataset";

    // 3. Quick Filter Logic
    let matchesQuickFilter = true;
    if (quickFilter === 'sinta1') {
        matchesQuickFilter = paper.sinta === 1;
    } else if (quickFilter === 'top_rated') {
        matchesQuickFilter = paper.aiScore >= 90;
    } else if (quickFilter === 'verified') {
        matchesQuickFilter = paper.status === 'verified';
    }

    return matchesSearch && matchesType && matchesQuickFilter;
  });

  // For client-side filtering, use filtered results; for pagination, we use server-side data
  // Note: If filters are active, show filtered results with client-side pagination
  const hasActiveFilters = searchTerm || filterType !== "all" || quickFilter !== 'none';
  const displayPapers = hasActiveFilters ? filteredPapers : papers;
  const totalPages = hasActiveFilters
    ? Math.ceil(filteredPapers.length / ITEMS_PER_PAGE)
    : Math.ceil(papers.length / ITEMS_PER_PAGE) + 1; // +1 because we don't know total count

  const startIndex = hasActiveFilters ? (currentPage - 1) * ITEMS_PER_PAGE : 0;
  const currentPapers = hasActiveFilters
    ? displayPapers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    : papers;

  // Reset page when filters change
  useEffect(() => {
    if (hasActiveFilters) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterType, quickFilter, hasActiveFilters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(p => p + 1);
  };

  const toggleQuickFilter = (type: 'sinta1' | 'top_rated' | 'verified') => {
      setQuickFilter(prev => prev === type ? 'none' : type);
  };

  // --- UI HELPERS ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-[#0065D1] text-white border-2 border-black rounded-none font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><ShieldCheck className="h-3 w-3 mr-1" /> VERIFIED</Badge>;
      case 'processing': return <Badge className="bg-yellow-300 text-black border-2 border-black rounded-none font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Clock className="h-3 w-3 mr-1" /> PROCESSING</Badge>;
      default: return <Badge className="bg-neutral-800 text-white border-2 border-black rounded-none font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Database className="h-3 w-3 mr-1" /> DATA POOL</Badge>;
    }
  };

  const getCardBorderColor = (status: string) => {
     switch (status) {
      case 'verified': return 'border-l-[#0065D1]';
      case 'processing': return 'border-l-yellow-300';
      default: return 'border-l-neutral-800';
    }
  }

  return (
    <div className="w-full min-h-screen bg-white pb-20 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 md:px-6 pt-12">
        {/* HEADER */}
        <div className="mb-12 border-b-4 border-black pb-8">
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-sm font-bold font-mono mb-4 transform -rotate-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              LIVE BLOCKCHAIN DATA
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-4">
                Knowledge <br className="md:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Graph</span>
            </h1>
            <p className="text-xl font-medium text-neutral-800 max-w-2xl border-l-4 border-black pl-4">
                Discover verified academic papers, datasets, and intellectual property from the blockchain.
            </p>
        </div>

        {/* SEARCH & FILTER */}
        <div className="p-6 mb-12 bg-neutral-100 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black pointer-events-none" />
              <Input
                placeholder="SEARCH IP ASSETS..."
                className="pl-12 h-14 bg-white border-2 border-black rounded-none text-lg font-bold placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px] h-14 bg-white border-2 border-black rounded-none font-bold text-black focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <SelectValue placeholder="ASSET TYPE" />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                  <SelectItem value="all" className="font-bold focus:bg-yellow-200 focus:text-black cursor-pointer">ALL ASSETS</SelectItem>
                  <SelectItem value="research" className="font-bold focus:bg-yellow-200 focus:text-black cursor-pointer">RESEARCH PAPERS</SelectItem>
                  <SelectItem value="dataset" className="font-bold focus:bg-yellow-200 focus:text-black cursor-pointer">DATASETS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* STATS BAR & QUICK FILTERS */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 px-1 gap-4">
          <p className="text-lg font-bold font-mono">
            FOUND <span className="bg-black text-white px-2 py-0.5">{filteredPapers.length}</span> ASSETS
          </p>
          <div className="flex gap-3">
            <Badge variant="outline" onClick={() => toggleQuickFilter('sinta1')} className={`cursor-pointer border-2 border-black rounded-none px-3 py-1 font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none ${quickFilter === 'sinta1' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                {quickFilter === 'sinta1' && <X className="w-3 h-3 mr-1" />} SINTA 1 ONLY
            </Badge>
            <Badge variant="outline" onClick={() => toggleQuickFilter('top_rated')} className={`cursor-pointer border-2 border-black rounded-none px-3 py-1 font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none ${quickFilter === 'top_rated' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                {quickFilter === 'top_rated' && <X className="w-3 h-3 mr-1" />} TOP RATED
            </Badge>
            <Badge variant="outline" onClick={() => toggleQuickFilter('verified')} className={`cursor-pointer border-2 border-black rounded-none px-3 py-1 font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none ${quickFilter === 'verified' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                {quickFilter === 'verified' && <X className="w-3 h-3 mr-1" />} VERIFIED ONLY
            </Badge>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 border-4 border-black border-dashed bg-neutral-50">
            <Loader2 className="h-12 w-12 animate-spin text-black mb-4" />
            <p className="font-black text-lg uppercase animate-pulse">Loading from blockchain...</p>
            <p className="text-sm text-neutral-500 mt-2">Fetching papers from Arbitrum Sepolia</p>
          </div>
        ) : (
          <>
            {/* GRID CONTENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPapers.map((paper) => (
                <Link to={`/asset/${paper.id}`} key={paper.id} className="group h-full block">
                  <Card className={`h-full flex flex-col justify-between bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 border-l-[8px] ${getCardBorderColor(paper.status)}`}>
                    <div className="p-6 space-y-4 flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="bg-white text-black border-2 border-black rounded-none font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              {paper.type === 'Research' ? <BookOpen className="mr-2 h-3 w-3"/> : <Database className="mr-2 h-3 w-3"/>}
                              {paper.type.toUpperCase()}
                            </Badge>
                            {getStatusBadge(paper.status)}
                        </div>
                        <h3 className="font-black text-xl leading-tight group-hover:underline decoration-2 underline-offset-4 cursor-pointer min-h-[3.5rem]">
                            {paper.title.toUpperCase()}
                        </h3>
                        <div className="flex items-center space-x-3 border-b-2 border-black pb-4 border-dashed">
                            <Avatar className="h-10 w-10 border-2 border-black rounded-none bg-yellow-100">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${paper.author}`} />
                              <AvatarFallback className="font-bold text-black rounded-none">{paper.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <p className="font-bold leading-none line-clamp-1">{paper.author}</p>
                              <p className="text-neutral-600 font-medium text-xs mt-1 line-clamp-1 font-mono">{paper.authorOrg}</p>
                            </div>
                        </div>
                        <div className="relative pl-3 border-l-4 border-neutral-300 text-sm text-neutral-600 italic line-clamp-3 font-medium">
                            "{paper.abstract}"
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs pt-2">
                             <div className="flex items-center border border-black bg-neutral-100 px-2 py-1 font-bold">
                                <FileKey className="w-3 h-3 mr-1"/>
                                {paper.license}
                             </div>
                             {paper.sinta ? (
                                 <div className={`flex items-center border border-black px-2 py-1 font-bold text-orange-800 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${paper.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-orange-100'}`}>
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {paper.status === 'verified' ? `SINTA ${paper.sinta}` : `CANDIDATE SINTA ${paper.sinta}`}
                                 </div>
                             ) : (
                                 <div className="flex items-center border border-black bg-neutral-100 px-2 py-1 font-bold text-neutral-400 uppercase">
                                    UNRANKED
                                 </div>
                             )}
                        </div>
                    </div>
                    <div className="bg-black text-white p-4 flex justify-between items-center border-t-2 border-black">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 ${paper.aiScore >= 80 ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'} border border-white font-bold`}>
                                <Sparkles className="h-3 w-3" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">AI TRUST SCORE</span>
                                <span className="text-sm font-bold font-mono"> {paper.aiScore}/100 </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono font-bold">
                            <div className="flex items-center gap-1"><Eye className="h-3 w-3 text-neutral-400" /> {paper.views}</div>
                            <div className="flex items-center gap-1"><Download className="h-3 w-3 text-neutral-400" /> {paper.downloads}</div>
                            <ArrowUpRight className="h-4 w-4 ml-2"/>
                        </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            {hasActiveFilters && filteredPapers.length > ITEMS_PER_PAGE ? (
              // Client-side pagination for filtered results
              <div className="flex justify-center items-center mt-12 gap-4">
                  <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="h-12 w-12 p-0 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0">
                      <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <div className="font-black text-lg bg-yellow-300 border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      PAGE {currentPage} / {totalPages}
                  </div>
                  <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-12 w-12 p-0 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0">
                      <ChevronRight className="h-6 w-6" />
                  </Button>
              </div>
            ) : !hasActiveFilters && papers.length > 0 ? (
              // Server-side "Load More" button for unfiltered results
              <div className="flex justify-center mt-12">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoading || papers.length < ITEMS_PER_PAGE}
                    className="h-14 px-8 bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> LOADING...
                      </>
                    ) : papers.length < ITEMS_PER_PAGE ? (
                      "NO MORE ASSETS"
                    ) : (
                      "LOAD MORE ASSETS"
                    )}
                  </Button>
              </div>
            ) : null}

            {/* Empty State */}
            {filteredPapers.length === 0 && (
              <div className="text-center py-20 bg-yellow-100 border-4 border-black border-dashed mt-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <FolderOpen className="h-16 w-16 text-black mx-auto mb-6" />
                <h3 className="text-3xl font-black uppercase mb-2">No Assets Found</h3>
                <p className="text-lg font-medium text-neutral-800 mb-8 max-w-md mx-auto">Try clearing your filters or search terms.</p>
                <Button onClick={() => {setSearchTerm(""); setFilterType("all"); setQuickFilter('none');}} className="h-14 px-8 border-2 border-black bg-black text-white rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase">
                    CLEAR ALL FILTERS
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
