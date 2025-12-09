import { useState, useEffect } from "react";
import { Database, Server, FileJson, Lock, Search, Filter, CloudLightning, TrendingUp, ShieldCheck, Download, ChevronRight, Loader2, HardDrive, FileText, BarChart3, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
}

export default function DataPoolPage() {
  const [ipAssets, setIpAssets] = useState<IPAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchIPAssetsFromStory = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const fetchedData: IPAsset[] = [
      { ipId: "IPA-0x123...89", title: "Indonesian Law Text Corpus (Raw)", description: "Aggregation of 5,230 rejected legal analysis papers. Ideal for training Legal LLMs on Indonesian context.", size: "4.2 GB", itemCount: "5,230 Docs", format: "JSONL", price: "200 IP", licenseType: "Non-Commercial", integrityScore: 98, downloads: 120, tags: ["Legal", "Bahasa Indonesia"] },
      { ipId: "IPA-0x456...BC", title: "Negative Results: Organic Chem 2024", description: "Collection of failed experiments. Crucial for preventing AI hallucinations in scientific generation.", size: "1.8 GB", itemCount: "1,200 Logs", format: "CSV", price: "50 IP", licenseType: "Commercial-Allowed", integrityScore: 95, downloads: 85, tags: ["Chemistry", "Hard Science"] },
      { ipId: "IPA-0x789...EF", title: "Mixed Quality Academic English", description: "Papers flagged by AI for grammar issues. Perfect for training 'Grammar Correction' models.", size: "15 GB", itemCount: "12,500 Docs", format: "TXT", price: "150 IP", licenseType: "Non-Commercial", integrityScore: 88, downloads: 340, tags: ["NLP", "Education"] },
      { ipId: "IPA-0xABC...12", title: "Economic Prediction Failures", description: "Dataset of incorrect economic forecasts. Useful for analyzing common bias patterns.", size: "500 MB", itemCount: "800 PDFs", format: "PDF", price: "25 IP", licenseType: "Non-Commercial", integrityScore: 92, downloads: 45, tags: ["Economics", "Behavioral"] }
    ];
    setIpAssets(fetchedData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIPAssetsFromStory();
  }, []);

  const filteredAssets = ipAssets.filter(asset => 
    asset.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.ipId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white pb-20 font-sans relative selection:bg-yellow-300 selection:text-black">
      {/* Background Grid Pattern (Sama seperti Hero) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* 1. HERO SECTION (Modified for Data Pool Context) */}
      <section className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto mb-16">
            
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white border-2 border-black px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8 transform hover:-translate-y-1 transition-transform cursor-crosshair">
              <CloudLightning className="h-5 w-5" />
              <span className="font-bold tracking-tight uppercase text-sm">Story Protocol • Data Layer</span>
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
              We monetize rejected papers. Get massive datasets of 
              <span className="bg-yellow-300 px-1 mx-1  font-bold text-black">Junk IP</span> 
              to train robust, hallucination-resistant models—fully compliant via Story Protocol.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                onClick={fetchIPAssetsFromStory} 
                disabled={isLoading}
                className={`h-14 px-8 text-lg font-bold text-white border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all ${BRAND_BLUE}`}
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                {isLoading ? "Syncing Registry..." : "Refresh IP Data"}
              </Button>
              
              <Button 
                className="h-14 px-8 text-lg font-bold bg-white text-black border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                View Documentation <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION (Brutalist Boxes) */}
      <section className="container mx-auto px-4 mb-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Data Volume", value: "14.2 TB", icon: HardDrive, bg: "bg-indigo-100 group-hover:bg-indigo-300" },
            { label: "Contributors", value: "8,204", icon: Server, bg: "bg-pink-100 group-hover:bg-pink-300" },
            { label: "Royalty Paid", value: "125K IP", icon: TrendingUp, bg: "bg-emerald-100 group-hover:bg-emerald-300" },
            { label: "Active Licenses", value: "342", icon: Lock, bg: "bg-yellow-100 group-hover:bg-yellow-300" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className={`w-12 h-12 flex items-center justify-center border-2 border-black mb-4 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${stat.bg}`}>
                 <stat.icon className="h-6 w-6 text-black" />
              </div>
              <div className="text-4xl font-black font-mono tracking-tighter mb-1">{stat.value}</div>
              <div className="text-sm font-bold uppercase tracking-widest text-neutral-600 border-b-2 border-transparent group-hover:border-black inline-block transition-all">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MAIN CONTENT */}
      <section className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Search Bar - Brutalist Style */}
        <div className="bg-neutral-100 p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h2 className="text-4xl font-black uppercase tracking-tighter self-start md:self-center">
                    Available Assets
                </h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-[400px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black pointer-events-none" />
                        <Input 
                            placeholder="SEARCH BY IP ID OR TITLE..." 
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

        {/* --- LOADING STATE --- */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 border-2 border-black border-dashed bg-white">
            <Loader2 className="h-16 w-16 animate-spin text-black" />
            <p className="text-xl font-bold font-mono uppercase tracking-widest">Syncing with Story Protocol...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <div key={asset.ipId} className="group relative h-full">
                  <Card className="h-full border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300 bg-white flex flex-col overflow-visible">
                    
                    {/* Header */}
                    <div className="p-6 border-b-2 border-black bg-neutral-50 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <Badge variant="outline" className="text-xs font-bold text-black border-2 border-black bg-white rounded-none font-mono py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {asset.ipId}
                            </Badge>
                            <Badge className={`${BRAND_BLUE} text-white border-2 border-black rounded-none font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform`}>
                                {asset.licenseType.toUpperCase()}
                            </Badge>
                        </div>
                        <h3 className="text-2xl font-black uppercase leading-tight group-hover:underline decoration-4 underline-offset-4 cursor-pointer">
                            {asset.title}
                        </h3>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 flex-1">
                        <p className="text-lg font-medium text-neutral-800 leading-relaxed">
                            {asset.description}
                        </p>

                        {/* Metadata Blocks (Chunky Style) */}
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

                        {/* Custom Progress Bar (Brutalist) */}
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
                                {/* Grid lines inside progress bar */}
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_19px,#000_1px)] bg-[size:20px_100%] opacity-20 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-5 border-t-2 border-black bg-black text-white flex justify-between items-center mt-auto">
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Mint Price</span>
                            <span className="text-2xl font-black font-mono text-yellow-300">{asset.price}</span>
                        </div>
                        <Button className="h-12 bg-white text-black border-2 border-transparent hover:border-white hover:bg-black hover:text-white rounded-none font-black transition-all hover:shadow-[0px_0px_0px_2px_white]">
                            MINT LICENSE <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-24 border-4 border-black border-dashed bg-white">
                <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-black" />
                <h3 className="text-3xl font-black uppercase mb-2">No Assets Found</h3>
                <p className="text-lg font-bold text-neutral-500">
                    ZERO RESULTS FOR "{searchTerm.toUpperCase()}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Custom Request CTA - Warning Box Style */}
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
                    Our Data DAO can curate specific failed experiments tailored to your model's needs. 
                    <span className="block mt-2 bg-black text-white px-2 py-1 text-sm font-mono w-fit">HANDLED BY RESEARCHERS</span>
                </p>
                <div>
                    <Button className="h-14 px-10 text-lg bg-white text-black border-2 border-black rounded-none font-black hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
                        CONTACT DATA DAO <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent bg-[size:10px_10px] pointer-events-none" />
        </div>

      </section>
    </div>
  );
}