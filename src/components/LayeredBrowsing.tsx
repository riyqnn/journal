import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaperCard } from "./PaperCard";
import { Search, Filter, CheckCircle2, Bot, Database, ArrowRight, Loader2 } from "lucide-react";
import { getAllPapers, Paper } from "@/database/MockData";
import { formatDistanceToNow } from "date-fns";

export const LayeredBrowsing = () => {
  const [searchQuery, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [paperData, setPaperData] = useState<{
    verified: Paper[];
    processing: Paper[];
    data_pool: Paper[];
  }>({ verified: [], processing: [], data_pool: [] });

  const [isLoading, setIsLoading] = useState(true);

  const fetchLivedata = useCallback(async () => {
    const allPapers = getAllPapers();
    const newVerified: Paper[] = [];
    const newProcessing: Paper[] = [];
    const newDataPool: Paper[] = [];
    const promises = allPapers.map(async (item) => {
      // Clone item agar aman
      const finalItem = { ...item };

      // --- LOGIC IPFS FETCHING ---
      // Jika ada link metadata, kita coba update judul/abstrak agar fresh
      if (finalItem.metadataUrl) {
        try {
          const res = await fetch(finalItem.metadataUrl);
          if (res.ok) {
            const meta = await res.json();
            // Update field jika di IPFS ada datanya
            finalItem.title = meta.name || finalItem.title;
            finalItem.abstract = meta.description || finalItem.abstract;

            const authorAttr = meta.attributes?.find((a: any) => a.trait_type === "Author");
            if (authorAttr) finalItem.author = authorAttr.value;
          }
        } catch (err) {
          console.warn(`IPFS fetch failed for ${finalItem.id}`, err);
        }
      }

      // --- LOGIC TIMESTAMP ---

      if (finalItem.timestamp) {
        try {
          finalItem.mintDate = formatDistanceToNow(new Date(finalItem.timestamp), { addSuffix: true });
        } catch (e) { /* ignore error, keep original string */ }
      } else if (finalItem.mintDate !== "Just now" && !finalItem.mintDate.includes("ago")) {
        const dateObj = new Date(finalItem.mintDate);
        if (!isNaN(dateObj.getTime())) {
          finalItem.mintDate = formatDistanceToNow(dateObj, { addSuffix: true });
        }
      }

      // --- KATEGORISASI ---
      if (finalItem.status === 'verified') newVerified.push(finalItem);
      else if (finalItem.status === 'processing') newProcessing.push(finalItem);
      else newDataPool.push(finalItem);
    });

    await Promise.all(promises);

    // Update State
    setPaperData({
      verified: newVerified,
      processing: newProcessing,
      data_pool: newDataPool
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLivedata();
    const interval = setInterval(() => fetchLivedata(), 5000);
    return () => clearInterval(interval);
  }, [fetchLivedata]);

  const layerStats = {
    verified: paperData.verified.length,
    processing: paperData.processing.length,
    data_pool: paperData.data_pool.length
  };

  const renderPaperCard = (paper: Paper) => {
    const cardProps = {
      title: paper.title.toUpperCase(),
      abstract: paper.abstract,
      authors: [{ name: paper.author, sintaLevel: paper.sinta || 0 }], 
      status: paper.status,
      submitDate: paper.mintDate,
      category: paper.category || "Research",
      views: paper.views,
      downloads: paper.downloads,
      royaltyShare: paper.royaltyShare || "0%",
      aiScore: paper.aiScore,
      licenseType: paper.license
    };

    return (
      <Link to={`/asset/${paper.id}`} key={paper.id} className="block group">
        <PaperCard {...cardProps} />
      </Link>
    );
  };

  return (
    <section className="relative py-20 bg-white border-black min-h-[800px]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 px-4 mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b-2 border-black pb-8">
          <div>
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Knowledge Graph</h2>
            <p className="text-lg font-medium text-neutral-700 max-w-2xl">
              Discover Verified IP, track works in progress, or access raw data from the Data Pool to train your models.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-green-400 text-black border-2 border-black p-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm flex items-center gap-2 cursor-pointer hover:bg-green-500 transition-colors" onClick={fetchLivedata}>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> LIVE SYNC ACTIVE
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
                  <SelectItem value="all" className="focus:bg-yellow-200">All Categories</SelectItem>
                  <SelectItem value="blockchain" className="focus:bg-yellow-200">Blockchain</SelectItem>
                  <SelectItem value="ai" className="focus:bg-yellow-200">AI & Data</SelectItem>
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
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 border-4 border-black border-dashed bg-neutral-50">
                <Loader2 className="h-12 w-12 animate-spin text-black mb-4" />
                <p className="font-bold text-lg uppercase animate-pulse">Syncing with Story Protocol...</p>
              </div>
            ) : (
              <>
                <TabsContent value="verified" className="space-y-6 mt-0">
                  {paperData.verified.length > 0 ? (
                    <div className="grid gap-6">
                      {paperData.verified.slice(0, 3).map(renderPaperCard)}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-4 border-black border-dashed bg-neutral-50 font-bold text-neutral-500 uppercase">No Verified Assets Found</div>
                  )}
                </TabsContent>

                <TabsContent value="processing" className="space-y-6 mt-0">
                  {paperData.processing.length > 0 ? (
                    <div className="grid gap-6">
                      {paperData.processing.slice(0, 3).map(renderPaperCard)}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-4 border-black border-dashed bg-neutral-50 font-bold text-neutral-500 uppercase">No Pending Submissions</div>
                  )}
                </TabsContent>

                <TabsContent value="data_pool" className="space-y-6 mt-0">
                  {paperData.data_pool.length > 0 ? (
                    <div className="grid gap-6">
                      {paperData.data_pool.slice(0, 3).map(renderPaperCard)}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-4 border-black border-dashed bg-neutral-50 font-bold text-neutral-500 uppercase">Data Pool is Empty</div>
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