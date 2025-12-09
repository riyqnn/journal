import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Shield, Bot, FileKey, Database } from "lucide-react";

// Mengambil warna biru dari logo (estimasi hex)
const BRAND_BLUE = "bg-[#0065D1]"; 

export const HeroSection = () => {
  return (
    <section className=" min-h-screen relative py-24 overflow-hidden bg-white text-black font-sans selection:bg-yellow-300 selection:text-black">
      
      {/* Background Grid Pattern (Technical Look) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center max-w-5xl mx-auto mb-20">
          
          {/* Badge: Neo-Brutalist Style (Solid border, hard shadow) */}
          <div className="inline-flex items-center space-x-2 bg-white border-2 border-black px-4 py-2 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8 transform hover:-translate-y-1 transition-transform cursor-crosshair">
            <Shield className="h-5 w-5" />
            <span className="font-bold tracking-tight uppercase text-sm">Story Protocol • AI Powered</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
            Turn Academic Papers into <br />
            {/* Highlight effect similar to a marker */}
            <span className={`relative inline-block px-4 py-1 mx-1 text-white transform -rotate-1 ${BRAND_BLUE}`}>
              <span className="absolute inset-0 border-2 border-black translate-x-1 translate-y-1 bg-black -z-10"></span>
              Liquid IP Assets
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl font-medium text-neutral-800 mb-10 leading-relaxed max-w-3xl mx-auto border-l-4 border-black pl-6 text-left md:text-center md:border-l-0 md:pl-0">
            JUDOL replaces predatory journals with an on-chain reputation economy. 
            <span className="bg-yellow-300 px-1 mx-1 border-black font-bold">AI Agents</span> 
            validate quality, and 
            <span className="bg-green-300 px-1 mx-1 border-black font-bold">Story Protocol</span> 
            ensures you get paid for every citation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Primary Button */}
            <Button 
              onClick={() => window.location.href = '/mint'} 
              className={`h-14 px-8 text-lg font-bold text-white border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all ${BRAND_BLUE}`}
            >
              Mint Your IP Asset <FileKey className="ml-2 h-5 w-5" />
            </Button>
            
            {/* Secondary Button */}
            <Button 
              onClick={() => window.location.href = '/explore'} 
              className="h-14 px-8 text-lg font-bold bg-white text-black border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              Explore Data Pool <Database className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Feature Cards (The Story Protocol Flow) */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Card 1: Verified IP */}
          <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group">
            <div className={`w-14 h-14 flex items-center justify-center border-2 border-black mb-4 bg-indigo-100 group-hover:bg-indigo-300 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
              <FileKey className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-2xl font-black mb-3">Verified IP Asset</h3>
            <p className="text-base font-medium text-neutral-700 leading-relaxed">
              Passes AI & Peer Review. Minted with a <strong>Commercial License</strong>. You earn royalties whenever it is cited.
            </p>
          </div>

          {/* Card 2: AI Gatekeeper */}
          <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group">
            <div className={`w-14 h-14 flex items-center justify-center border-2 border-black mb-4 bg-pink-100 group-hover:bg-pink-300 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
              <Bot className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-2xl font-black mb-3">AI Pre-Screening</h3>
            <p className="text-base font-medium text-neutral-700 leading-relaxed">
              Our AI Agent scans for plagiarism instantly. No more waiting 6 months just to get rejected by bias.
            </p>
          </div>

          {/* Card 3: Data Pool */}
          <div className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group">
            <div className={`w-14 h-14 flex items-center justify-center border-2 border-black mb-4 bg-emerald-100 group-hover:bg-emerald-300 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
              <Database className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-2xl font-black mb-3">Data Assets</h3>
            <p className="text-base font-medium text-neutral-700 leading-relaxed">
              Rejected papers aren't deleted. They become <strong>Rights-Cleared Data</strong> for AI training.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};