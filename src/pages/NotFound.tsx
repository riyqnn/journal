import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home, FileWarning, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-yellow-300 font-sans flex flex-col items-center justify-center relative overflow-hidden border-t-4 border-black selection:bg-black selection:text-yellow-300">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="container px-4 relative z-10 max-w-2xl">
        
        {/* Main Error Box */}
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 text-center relative">
          
          {/* Floating Icon */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle className="w-12 h-12" />
          </div>

          <div className="mt-8 space-y-6">
            <div>
                <h1 className="text-8xl font-black mb-2 tracking-tighter">404</h1>
                <h2 className="text-2xl font-black uppercase bg-black text-white inline-block px-4 py-1 transform -rotate-2">
                    PAGE NOT FOUND
                </h2>
            </div>

            <p className="text-lg font-medium text-neutral-800">
                Oops! The block you are looking for has not been mined or does not exist in our protocol.
            </p>

            {/* Technical Debug Box */}
            <div className="bg-neutral-100 border-2 border-black p-4 text-left font-mono text-sm space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-2 text-red-600 font-bold border-b-2 border-black pb-2 mb-2">
                    <FileWarning className="w-4 h-4" /> ERROR_LOG_DUMP
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-neutral-500">Status:</span>
                    <span className="font-bold">404 (Not Found)</span>
                    
                    <span className="text-neutral-500">Route:</span>
                    <span className="break-all bg-yellow-200 px-1 border border-black text-black">
                        {location.pathname}
                    </span>
                    
                    <span className="text-neutral-500">Timestamp:</span>
                    <span>{new Date().toISOString()}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                    <Button className="w-full sm:w-auto h-12 px-8 bg-black text-white border-2 border-black rounded-none font-black text-lg shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
                        <Home className="mr-2 h-5 w-5" /> RETURN HOME
                    </Button>
                </Link>
                
                <Button 
                    variant="outline" 
                    onClick={() => window.history.back()}
                    className="w-full sm:w-auto h-12 px-8 bg-white text-black border-2 border-black rounded-none font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 hover:-translate-y-1 transition-all"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" /> GO BACK
                </Button>
            </div>

          </div>
        </div>

        {/* Footer Decoration */}
        <div className="mt-8 text-center font-mono font-bold text-black bg-white border-2 border-black inline-block px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            SYSTEM_ERR_UNKNOWN_REF
        </div>

      </div>
    </div>
  );
};

export default NotFound;