import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Download, Bot, Clock, CheckCircle2, Database, FileKey, Sparkles, ArrowUpRight } from "lucide-react";

export type PaperStatus = "verified" | "processing" | "data_pool";

interface Author {
  name: string;
  sintaLevel: number;
}

interface PaperCardProps {
  title: string;
  abstract: string;
  authors: Author[];
  status: PaperStatus;
  submitDate: string;
  category: string;
  views: number;
  downloads: number;
  royaltyShare?: string;
  aiScore: number;
  licenseType: string;
}

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    label: "VERIFIED IP",
    // Biru Brand, Teks Putih, Border Hitam
    className: "bg-[#0065D1] text-white border-2 border-black rounded-none font-bold",
    // Card accent border
    cardBorder: "border-l-[#0065D1]" 
  },
  processing: {
    icon: Bot,
    label: "AI PROCESSING",
    // Kuning Konstruksi, Teks Hitam, Border Hitam
    className: "bg-yellow-300 text-black border-2 border-black rounded-none font-bold",
    cardBorder: "border-l-yellow-400"
  },
  data_pool: {
    icon: Database,
    label: "DATA ASSET",
    // Hitam/Abu Gelap, Teks Putih, Border Hitam
    className: "bg-neutral-800 text-white border-2 border-black rounded-none font-bold",
    cardBorder: "border-l-neutral-800"
  }
};

const getSintaColor = (level: number) => {
    // Return simple classes for consistency (clean white look with colored text)
    const colors = {
      1: "text-indigo-700",
      2: "text-blue-700",
      3: "text-cyan-700",
      4: "text-teal-700",
      5: "text-slate-700"
    } as const;
    return colors[level as keyof typeof colors] || "text-black";
};

const getAiScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600 bg-green-100 border-green-600";
  if (score >= 70) return "text-yellow-600 bg-yellow-100 border-yellow-600";
  return "text-red-600 bg-red-100 border-red-600";
};

export const PaperCard = ({ 
  title, 
  abstract, 
  authors, 
  status, 
  submitDate, 
  category, 
  views, 
  downloads, 
  royaltyShare, 
  aiScore, 
  licenseType 
}: PaperCardProps) => {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={`
      group relative flex flex-col justify-between
      p-6 bg-white border-2 border-black rounded-none 
      shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
      hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
      hover:translate-x-[2px] hover:translate-y-[2px]
      transition-all duration-200 
      ${config.cardBorder} border-l-[8px]
    `}>
      <div className="space-y-4">
        
        {/* Header with Status and License */}
        <div className="flex flex-wrap gap-2 justify-between items-start">
          <div className="flex flex-wrap gap-2">
            <Badge className={`${config.className} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
              <StatusIcon className="w-4 h-4 mr-2" /> 
              {config.label}
            </Badge>
            
            <Badge variant="outline" className="bg-white text-black border-2 border-black rounded-none font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <FileKey className="w-3 h-3 mr-2" /> 
              {licenseType}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-1 text-xs font-mono font-bold border border-black px-2 py-1 bg-neutral-100">
            <Clock className="w-3 h-3" />
            <span>MINTED: {submitDate}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black leading-tight group-hover:underline decoration-2 underline-offset-4 cursor-pointer">
          {title}
        </h3>

        {/* Authors & AI Score Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          {/* Authors */}
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-3">
              {authors.slice(0, 3).map((author, index) => (
                <Avatar key={index} className="w-10 h-10 border-2 border-black rounded-none bg-white">
                  <AvatarFallback className="text-xs font-bold bg-yellow-200 text-black rounded-none">
                    {author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            
            <div className="text-sm">
              <div className="font-bold border-b border-black inline-block leading-none pb-0.5">
                {authors[0].name}
              </div>
              {authors.length > 1 && <span className="text-muted-foreground ml-1 font-mono text-xs">+{authors.length - 1} others</span>}
              
              <div className="flex gap-1 mt-1.5">
                {authors.map((a, i) => (
                  <span key={i} className={`text-[10px] font-bold px-1 py-0.5 border border-black bg-white ${getSintaColor(a.sintaLevel)}`}>
                    SINTA {a.sintaLevel}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Score Indicator */}
          <div className="flex flex-col items-end">
             <div className="flex items-center border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[10px] font-bold uppercase mr-2 border-r border-black pr-2">AI Score</span>
                <span className={`font-black text-sm flex items-center`}>
                    <Sparkles className="w-3 h-3 mr-1" /> {aiScore}
                </span>
             </div>
          </div>
        </div>

        {/* Abstract - Technical Look */}
        <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
            <p className="text-sm text-neutral-600 pl-4 py-1 leading-relaxed font-medium">
              "{abstract}"
            </p>
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-black mt-2">
          <div className="flex space-x-4 text-xs font-bold font-mono">
            <div className="flex items-center space-x-1 bg-neutral-100 px-2 py-1 border border-black">
              <Eye className="w-3 h-3" />
              <span>{views.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1 bg-neutral-100 px-2 py-1 border border-black">
              <Download className="w-3 h-3" />
              <span>{downloads.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            {royaltyShare && (
              <div className="hidden sm:block text-xs font-bold bg-green-300 text-black border border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ROYALTY: {royaltyShare}
              </div>
            )}
            
            <Button size="sm" className="h-9 rounded-none border-2 border-black bg-black text-white font-bold hover:bg-white hover:text-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
              VIEW ASSET <ArrowUpRight className="ml-1 w-3 h-3"/>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};