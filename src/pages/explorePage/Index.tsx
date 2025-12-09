import { useState, useEffect } from "react"; 
import { Link } from "react-router-dom"; 
import { Search, Filter, Sparkles, Download, Eye, BookOpen, Database, ShieldCheck, ChevronDown, Bot, AlertCircle, Clock, FileKey, ArrowUpRight } from "lucide-react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { Badge } from "@/components/ui/badge"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Card } from "@/components/ui/card"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 

// --- MOCK DATA (Data Statis) --- 
const MOCK_PAPERS = [ 
  { id: "1", title: "Optimizing ZK-Rollups for High Frequency Trading on Story Protocol", author: "Dr. Sari Wijaya", authorOrg: "ITB - Informatics", abstract: "This paper proposes a novel approach to latency reduction in ZK-Rollups verified by Reviewer DAO.", type: "Research", license: "Commercial (PIL)", sinta: 1, aiScore: 98, mintDate: "2024-11-15", views: 2450, downloads: 892, price: "50 IP", status: "verified" }, 
  { id: "2", title: "Legal Frameworks for AI-Generated IP Ownership in Indonesia", author: "Dr. Ahmad Rahman", authorOrg: "UI - Faculty of Law", abstract: "Analyzing the intersection of Indonesian Copyright Law and Generative AI outputs.", type: "Research", license: "Commercial (PIL)", sinta: 1, aiScore: 92, mintDate: "2024-11-20", views: 1890, downloads: 654, price: "45 IP", status: "verified" }, 
  { id: "3", title: "Dataset: 50,000 Hours of Bahasa Indonesia Voice Samples", author: "VoiceLab Indo", authorOrg: "Independent Research", abstract: "High-quality raw audio data cleared for LLM training. Ideal for text-to-speech models.", type: "Dataset", license: "Data Only", sinta: null, aiScore: 88, mintDate: "2024-12-01", views: 5200, downloads: 1200, price: "100 IP", status: "verified" }, 
  { id: "4", title: "Smart Contract Vulnerabilities in DAO Treasuries", author: "Dr. Made Suarta", authorOrg: "Udayana Univ", abstract: "A systematic review of reentrancy attacks in 2024. Currently under review by the Expert Node.", type: "Research", license: "Pending", sinta: 3, aiScore: 78, mintDate: "2024-11-29", views: 890, downloads: 234, price: "-", status: "processing" }, 
  { id: "5", title: "Failed Replication of Cold Fusion Experiment 2024", author: "Budi Santoso", authorOrg: "UGM - Physics", abstract: "Negative results from attempt to replicate cold fusion. Valuable for avoiding redundancy.", type: "Research", license: "Data Only", sinta: 4, aiScore: 45, mintDate: "2024-10-10", views: 300, downloads: 10, price: "Free", status: "data_pool" }, 
]; 

export default function ExplorePage() { 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [filterType, setFilterType] = useState("all"); 
  const [papers, setPapers] = useState(MOCK_PAPERS); 

  useEffect(() => { 
    const localData = localStorage.getItem("myAssets"); 
    if (localData) { 
      const parsedData = JSON.parse(localData); 
      const formattedLocalData = parsedData.map((item: any) => ({ 
        id: item.id, 
        title: item.title, 
        author: "You (Current User)", 
        authorOrg: "UIN Syarif Hidayatullah", 
        abstract: "This is a newly minted asset awaiting reviewer validation. Full abstract is encrypted on IPFS.", 
        type: item.type === "Research IP" ? "Research" : "Dataset", 
        license: item.license, 
        sinta: null, 
        aiScore: 85, 
        mintDate: "Just now", 
        views: 0, 
        downloads: 0, 
        price: "-", 
        status: item.status 
      })); 
      setPapers([...formattedLocalData, ...MOCK_PAPERS]); 
    } 
  }, []); 

  const filteredPapers = papers.filter((paper) => { 
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) || paper.author.toLowerCase().includes(searchTerm.toLowerCase()); 
    const matchesType = filterType === "all" ? true : paper.type.toLowerCase() === filterType.toLowerCase(); 
    return matchesSearch && matchesType; 
  }); 

  // --- NEO BRUTALIST HELPERS ---
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
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 md:px-6 pt-12"> 
        
        {/* 1. HEADER SECTION - Brutalist */} 
        <div className="mb-12 border-b-4 border-black pb-8"> 
            <div className="inline-block bg-black text-white px-3 py-1 text-sm font-bold font-mono mb-4 transform -rotate-2">
                DATABASE ACCESS
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-4"> 
                Knowledge <br className="md:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600" >Graph</span>
            </h1> 
            <p className="text-xl font-medium text-neutral-800 max-w-2xl border-l-4 border-black pl-4"> 
                Discover verified academic papers, datasets, and intellectual property minted on Story Protocol. 
            </p> 
        </div> 

        {/* 2. SEARCH & FILTER - Brutalist Box */} 
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
              <Select defaultValue="all" onValueChange={setFilterType}> 
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

        {/* 3. STATS BAR */} 
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 px-1 gap-4"> 
          <p className="text-lg font-bold font-mono"> 
            FOUND <span className="bg-black text-white px-2 py-0.5">{filteredPapers.length}</span> ASSETS 
          </p> 
          <div className="flex gap-3"> 
            <Badge variant="outline" className="cursor-pointer bg-white text-black border-2 border-black rounded-none px-3 py-1 font-bold hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">SINTA 1 ONLY</Badge> 
            <Badge variant="outline" className="cursor-pointer bg-white text-black border-2 border-black rounded-none px-3 py-1 font-bold hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">TOP RATED</Badge> 
          </div> 
        </div> 

        {/* 4. GRID CONTENT */} 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> 
          {filteredPapers.map((paper) => ( 
            <Link to={`/asset/${paper.id}`} key={paper.id} className="group h-full block"> 
              <Card className={`
                h-full flex flex-col justify-between
                bg-white border-2 border-black rounded-none 
                shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                hover:translate-x-[4px] hover:translate-y-[4px] 
                transition-all duration-200 
                border-l-[8px] ${getCardBorderColor(paper.status)}
              `}> 
                
                <div className="p-6 space-y-4 flex-1">
                    {/* Header: Type & Status */}
                    <div className="flex justify-between items-start mb-2"> 
                        <Badge variant="outline" className="bg-white text-black border-2 border-black rounded-none font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"> 
                            {paper.type === 'Research' ? <BookOpen className="mr-2 h-3 w-3"/> : <Database className="mr-2 h-3 w-3"/>} 
                            {paper.type.toUpperCase()} 
                        </Badge> 
                        {getStatusBadge(paper.status)} 
                    </div> 

                    {/* Title */}
                    <h3 className="font-black text-xl leading-tight group-hover:underline decoration-2 underline-offset-4 cursor-pointer min-h-[3.5rem]"> 
                        {paper.title} 
                    </h3> 

                    {/* Author */}
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

                    {/* Abstract */}
                    <div className="relative pl-3 border-l-4 border-neutral-300 text-sm text-neutral-600 italic line-clamp-3 font-medium"> 
                        "{paper.abstract}" 
                    </div> 

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap gap-2 text-xs pt-2"> 
                         <div className="flex items-center border border-black bg-neutral-100 px-2 py-1 font-bold">
                            <FileKey className="w-3 h-3 mr-1"/>
                            {paper.license}
                         </div>
                         {paper.sinta ? (
                             <div className="flex items-center border border-black bg-orange-100 px-2 py-1 font-bold text-orange-800">
                                SINTA {paper.sinta}
                             </div>
                         ) : (
                             <div className="flex items-center border border-black bg-neutral-100 px-2 py-1 font-bold text-neutral-400">
                                UNRANKED
                             </div>
                         )}
                    </div>
                </div>

                {/* Footer Metrics - Solid Background */}
                <div className="bg-black text-white p-4 flex justify-between items-center border-t-2 border-black"> 
                   
                    {/* AI Score */}
                    <div className="flex items-center gap-2"> 
                        <div className={`p-1 ${paper.aiScore >= 80 ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'} border border-white font-bold`}>
                            <Sparkles className="h-3 w-3" />
                        </div>
                        <div className="flex flex-col leading-none"> 
                            <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">AI SCORE</span> 
                            <span className="text-sm font-bold font-mono"> {paper.aiScore}/100 </span> 
                        </div> 
                    </div> 

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs font-mono font-bold"> 
                        <div className="flex items-center gap-1"> 
                            <Eye className="h-3 w-3 text-neutral-400" /> {paper.views} 
                        </div> 
                        <div className="flex items-center gap-1"> 
                            <Download className="h-3 w-3 text-neutral-400" /> {paper.downloads} 
                        </div> 
                        <ArrowUpRight className="h-4 w-4 ml-2"/>
                    </div> 
                </div> 

              </Card> 
            </Link> 
          ))} 
        </div> 

        {/* Empty State - Brutalist */} 
        {filteredPapers.length === 0 && ( 
          <div className="text-center py-20 bg-yellow-100 border-4 border-black border-dashed mt-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"> 
            <AlertCircle className="h-16 w-16 text-black mx-auto mb-6" /> 
            <h3 className="text-3xl font-black uppercase mb-2">No Assets Found</h3> 
            <p className="text-lg font-medium text-neutral-800 mb-8 max-w-md mx-auto">
                The database came up empty. Try adjusting your search keywords or removing filters.
            </p> 
            <Button 
                onClick={() => {setSearchTerm(""); setFilterType("all")}}
                className="h-12 border-2 border-black bg-white text-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
                CLEAR FILTERS
            </Button> 
          </div> 
        )} 
      </div> 
    </div> 
  ); 
}