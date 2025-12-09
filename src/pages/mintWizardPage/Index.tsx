import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, FileText, Sparkles, AlertTriangle, ArrowRight, Loader2, ShieldAlert, X, Lock, FileClock, Check, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useStory } from "@/hooks/useStory";
import { uploadFileToIPFS } from "@/lib/pinata";

// --- VALIDATION SCHEMA ---
const metadataSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  author: z.string().min(3, "Author name is required"),
  abstract: z.string().min(20, "Abstract must be at least 20 characters"),
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

export default function MintWizardPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Web3 Hook
  const { mintIP, isMinting: isWeb3Minting } = useStory();

  // State AI Result
  const [aiResult, setAiResult] = useState<{ score: number; tier: string; status: "ACCEPTED" | "REJECTED"; } | null>(null);

  const form = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: { title: "", author: "", abstract: "" },
  });

  // STEP 1: Handle File Upload
  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("Invalid file type", { description: "Please upload a PDF document." });
        return;
      }
      setFile(selectedFile);
      form.setValue("title", selectedFile.name.replace(".pdf", ""));
      toast.success("File uploaded", { description: "Ready for AI Analysis." });
    }
  };

  // STEP 2: Simulate AI Scanning
  const startAiScan = () => {
    setStep(2);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishScan();
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  };

  const finishScan = () => {
    const randomScore = Math.floor(Math.random() * 100);
    const isAccepted = randomScore >= 40;
    let predictedTier = "UNVERIFIED CANDIDATE";
    if (randomScore > 85) predictedTier = "CANDIDATE SINTA 1";
    else if (randomScore > 70) predictedTier = "CANDIDATE SINTA 2";
    else if (randomScore > 50) predictedTier = "CANDIDATE SINTA 3-4";

    setAiResult({
      score: randomScore,
      tier: predictedTier,
      status: isAccepted ? "ACCEPTED" : "REJECTED",
    });
    setStep(3);
  };

  // STEP 3: Handle Minting (REAL WEB3)
  const handleMint = async (data: MetadataFormValues) => {
    if (!file) {
      toast.error("Please upload a PDF file first!");
      return;
    }

    const toastUploadId = toast.loading("Uploading PDF to IPFS...");
    let ipfsHash = "";
    try {
      ipfsHash = await uploadFileToIPFS(file);
      toast.success("PDF Uploaded to IPFS!", { id: toastUploadId });
    } catch (error) {
      console.error("IPFS Upload Error:", error);
      toast.error("Failed to upload PDF to IPFS", { id: toastUploadId });
      return;
    }

    const result = await mintIP({
      title: data.title,
      ipfsHash: ipfsHash
    });

    if (result && result.success) {
      const newAsset = {
        id: result.ipId || "IP-PENDING",
        title: data.title,
        type: "Research IP",
        status: "processing",
        license: "Unverified (Draft)",
        earnings: "0 IP",
        views: 0,
        mintDate: "Just now",
        txHash: result.txHash,
        pdfUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      };

      const existingAssets = JSON.parse(localStorage.getItem("myAssets") || "[]");
      localStorage.setItem("myAssets", JSON.stringify([newAsset, ...existingAssets]));
      setStep(4);
    }
  };

  // --- HELPER COMPONENT: STEPPER ---
  const BrutalistStepper = ({ current }: { current: number }) => (
    <div className="flex justify-center items-center gap-4 mb-12 w-full max-w-2xl mx-auto">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`
            w-10 h-10 border-2 border-black flex items-center justify-center font-black text-lg transition-all
            ${current === s ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] transform -translate-y-1' : 
              current > s ? 'bg-green-500 text-black' : 'bg-white text-neutral-400'}
          `}>
            {current > s ? <Check className="w-6 h-6" /> : s}
          </div>
          {s !== 4 && <div className={`w-8 h-1 border-b-2 border-black ${current > s ? 'border-solid' : 'border-dashed opacity-30'}`} />}
        </div>
      ))}
    </div>
  );

  // --- RENDER COMPONENT PER STEP ---

  // STEP 1: UPLOAD
  if (step === 1) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center pt-20 pb-12 font-sans relative selection:bg-yellow-300 selection:text-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <BrutalistStepper current={1} />

        <div className="w-full max-w-2xl px-4 relative z-10">
          <div className="mb-8 text-center border-2 border-black bg-yellow-300 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Initialize Minting</h1>
            <p className="text-black font-bold uppercase tracking-wide">Phase 1: Document Submission</p>
          </div>

          <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardContent className="p-8">
              <div 
                className="border-4 border-black border-dashed bg-neutral-50 hover:bg-yellow-50 transition-colors p-12 text-center cursor-pointer group"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <div className="w-20 h-20 bg-black text-white mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)]">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h3 className="font-black text-2xl uppercase mb-2">Drag PDF Here</h3>
                <p className="font-bold text-neutral-500 uppercase text-sm">Or Click to Browse</p>
                <Input type="file" accept=".pdf" className="hidden" id="file-upload" onChange={handleFileDrop} />
              </div>

              {file && (
                <div className="mt-6 border-2 border-black bg-blue-100 p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-black" />
                      <span className="font-bold text-lg">{file.name}</span>
                   </div>
                   <Button variant="ghost" size="icon" className="hover:bg-red-500 hover:text-white border-2 border-black rounded-none h-10 w-10" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      <X className="w-5 h-5" />
                   </Button>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-black text-white p-6 flex justify-between items-center border-t-2 border-black">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Max 10MB • PDF Only</span>
              <Button 
                disabled={!file} 
                onClick={startAiScan}
                className="h-12 px-8 bg-white text-black border-2 border-transparent hover:border-white hover:bg-black hover:text-white rounded-none font-black uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Start AI Analysis <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // STEP 2: AI SCANNING
  if (step === 2) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-4 font-sans relative">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
         
         <div className="w-full max-w-xl text-center relative z-10 border-2 border-black p-12 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-24 h-24 bg-black text-yellow-300 mx-auto flex items-center justify-center mb-8 border-2 border-black animate-pulse shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                <BrainCircuit className="w-12 h-12" />
            </div>
            
            <h2 className="text-4xl font-black uppercase mb-2">Analyzing Content...</h2>
            <p className="font-bold text-neutral-500 uppercase mb-8">Scanning structure, plagiarism, and quality tier.</p>
            
            <div className="space-y-2 border-2 border-black p-1">
                <div className="h-8 w-full bg-neutral-100 relative">
                    <div 
                        className="absolute top-0 left-0 h-full bg-black transition-all duration-100 ease-linear" 
                        style={{ width: `${scanProgress}%` }}
                    />
                </div>
            </div>
            <p className="font-mono font-black text-right mt-2">{scanProgress}% COMPLETE</p>
         </div>
      </div>
    );
  }

  // STEP 3: RESULT DECISION
  if (step === 3 && aiResult) {
    // --- SKENARIO 1: REJECTED ---
    if (aiResult.status === "REJECTED") {
      return (
        <div className="min-h-screen w-full bg-red-50 flex items-center justify-center p-4 font-sans">
          <Card className="w-full max-w-lg border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none">
            <CardHeader className="text-center pb-6 border-b-2 border-black bg-red-100 pt-8">
              <div className="w-20 h-20 bg-red-600 text-white border-2 border-black flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <X className="w-10 h-10" />
              </div>
              <CardTitle className="text-4xl font-black uppercase text-red-600">Submission Rejected</CardTitle>
              <CardDescription className="font-bold text-black uppercase">Your paper did not meet the minimum quality threshold.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="border-2 border-black p-4 bg-red-50 space-y-2">
                <div className="flex justify-between font-black uppercase text-lg border-b-2 border-black pb-2 mb-2">
                  <span>AI Score</span>
                  <span>{aiResult.score}/100</span>
                </div>
                <p className="font-bold text-sm">REASON: HIGH LIKELIHOOD OF SPAM OR LOW QUALITY CONTENT DETECTED.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pb-8 pt-0">
              <Button className="h-12 px-8 bg-black text-white border-2 border-black rounded-none font-black uppercase hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" onClick={() => { setFile(null); setStep(1); }}>
                 Try Another File
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // --- SKENARIO 2: ACCEPTED (Mint Draft) ---
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center pt-12 pb-12 font-sans relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <BrutalistStepper current={3} />

        <div className="w-full max-w-6xl px-4 grid md:grid-cols-3 gap-8 relative z-10">
          
          {/* AI REPORT */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none">
              <CardHeader className="text-center pb-4 border-b-2 border-black bg-blue-100">
                <Badge variant="outline" className="w-fit mx-auto mb-2 bg-black text-white border-2 border-black rounded-none font-bold uppercase px-3 py-1">AI Analysis Passed</Badge>
                <div className="text-6xl font-black mb-1 flex items-center justify-center gap-2">
                  {aiResult.score} <span className="text-lg font-bold text-neutral-500 self-end mb-2">/100</span>
                </div>
                <CardTitle className="text-xl font-black uppercase text-blue-800">{aiResult.tier}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 p-6">
                <div className="space-y-4 font-mono text-sm font-bold">
                  <div className="flex justify-between items-center border-b-2 border-black border-dashed pb-2">
                    <span className="text-neutral-500 uppercase">Current Status</span>
                    <span className="bg-orange-200 px-2 py-0.5 border border-black flex items-center gap-1">
                      <Lock className="w-3 h-3" /> UNVERIFIED
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b-2 border-black border-dashed pb-2">
                    <span className="text-neutral-500 uppercase">License Tier</span>
                    <span className="bg-neutral-200 px-2 py-0.5 border border-black uppercase">Draft / Non-Comm</span>
                  </div>
                </div>
                <div className="p-4 border-2 border-black bg-yellow-200 font-bold text-xs uppercase leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                   Next Step: This asset will be minted as a "Draft" and routed to Human Reviewers for final verification.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* METADATA FORM */}
          <div className="md:col-span-2">
            <Card className="bg-white border-2 border-black rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-2 border-black bg-neutral-50 p-6">
                <CardTitle className="text-3xl font-black uppercase">Register IP Metadata</CardTitle>
                <CardDescription className="font-bold text-black uppercase opacity-60">Review details before minting on Story Protocol.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form id="mint-form" onSubmit={form.handleSubmit(handleMint)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-black uppercase text-sm">Paper Title</Label>
                    <Input id="title" placeholder="PAPER TITLE" className="h-12 border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 text-lg" {...form.register("title")} />
                    {form.formState.errors.title && <p className="text-xs font-bold text-red-600 uppercase bg-red-100 p-1 w-fit">{form.formState.errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author" className="font-black uppercase text-sm">Primary Author</Label>
                    <Input id="author" placeholder="AUTHOR NAME" className="h-12 border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0" {...form.register("author")} />
                    {form.formState.errors.author && <p className="text-xs font-bold text-red-600 uppercase bg-red-100 p-1 w-fit">{form.formState.errors.author.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abstract" className="font-black uppercase text-sm">Abstract</Label>
                    <Textarea id="abstract" className="min-h-[120px] border-2 border-black rounded-none font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 resize-none" placeholder="Paste abstract here..." {...form.register("abstract")} />
                    {form.formState.errors.abstract && <p className="text-xs font-bold text-red-600 uppercase bg-red-100 p-1 w-fit">{form.formState.errors.abstract.message}</p>}
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between bg-black p-6 border-t-2 border-black">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-white hover:bg-white hover:text-black font-bold uppercase rounded-none">Cancel</Button>
                
                <Button 
                    type="submit" 
                    form="mint-form" 
                    disabled={isWeb3Minting} 
                    className="h-12 px-8 bg-blue-600 text-white border-2 border-blue-600 hover:bg-white hover:text-blue-600 rounded-none font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all"
                >
                  {isWeb3Minting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> WAITING FOR WALLET...
                    </>
                  ) : (
                    <>
                      <FileClock className="mr-2 h-5 w-5" /> MINT DRAFT IP
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: SUCCESS
  if (step === 4) {
    return (
      <div className="min-h-screen w-full bg-green-50 flex flex-col items-center justify-center p-4 font-sans relative">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
         
         <BrutalistStepper current={4} />

         <div className="w-full max-w-lg text-center relative z-10">
            <div className="w-24 h-24 bg-green-500 text-white border-2 border-black flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Check className="w-12 h-12" />
            </div>
            
            <h2 className="text-4xl font-black uppercase mb-2">Draft Minted!</h2>
            <p className="font-bold text-neutral-600 uppercase mb-8">Your IP Asset is now <span className="bg-orange-200 px-1 border border-black text-black">Under Review</span> on Story Protocol.</p>
            
            <Card className="text-left bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                <CardContent className="pt-8 space-y-4 pb-8">
                    <div className="flex justify-between items-center border-b-2 border-black border-dashed pb-2">
                        <span className="font-bold uppercase text-neutral-500 text-xs">IP Asset ID</span>
                        <span className="font-mono font-black text-sm bg-neutral-100 px-2 border border-black">IP-82910</span>
                    </div>
                    <div className="flex justify-between items-center border-b-2 border-black border-dashed pb-2">
                        <span className="font-bold uppercase text-neutral-500 text-xs">Status</span>
                        <Badge variant="outline" className="bg-orange-300 text-black border-2 border-black rounded-none font-bold uppercase text-xs">Pending Verification</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold uppercase text-neutral-500 text-xs">Next Reviewer</span>
                        <span className="font-black text-sm uppercase">Expert DAO (Node #4)</span>
                    </div>
                </CardContent>
            </Card>

            <Link to="/dashboard">
                <Button className="w-full h-14 bg-black text-white border-2 border-black rounded-none font-black uppercase text-lg shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                    Track Status in Dashboard
                </Button>
            </Link>
         </div>
      </div>
    );
  }

  return null;
}