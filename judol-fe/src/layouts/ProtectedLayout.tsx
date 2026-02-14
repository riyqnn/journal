import { useAccount } from "wagmi";
import { Outlet } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Wallet, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProtectedLayout = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 bg-white font-sans relative overflow-hidden selection:bg-yellow-300 selection:text-black">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <Card className="relative z-10 w-full max-w-md text-center border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          
          {/* Header Section */}
          <CardHeader className="space-y-6 pt-10 pb-2 border-b-2 border-black bg-neutral-50">
            <div className="mx-auto w-24 h-24 bg-black text-yellow-300 flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] mb-2">
              <Lock className="w-12 h-12" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-4xl font-black uppercase tracking-tighter text-black">
                Restricted <br/> Area
              </CardTitle>
              <CardDescription className="font-bold text-neutral-500 uppercase tracking-wide">
                Authentication Required
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            
            {/* Warning Box */}
            <div className="bg-yellow-200 border-2 border-black p-4 flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="bg-black text-white p-1 shrink-0">
                 <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-black leading-snug">
                Features like <span className="underline decoration-2">Minting IP</span>, <span className="underline decoration-2">Voting</span>, and <span className="underline decoration-2">Dashboard</span> require a blockchain signature to verify your identity.
              </p>
            </div>

            {/* Custom Connect Button (Agar seragam dengan Header) */}
            <div className="flex justify-center pt-2">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading';
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === 'authenticated');

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                      className="w-full"
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <Button 
                                onClick={openConnectModal} 
                                className="w-full h-14 text-lg bg-black text-white border-2 border-black rounded-none font-black shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all uppercase"
                            >
                              <Wallet className="mr-2 h-6 w-6" /> Connect Wallet
                            </Button>
                          );
                        }
                        return null; // Should not happen in protected route logic
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

  // Kalau sudah connect, render halaman aslinya
  return <Outlet />;
};