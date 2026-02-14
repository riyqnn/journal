import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Bell, Sparkles, PlusCircle, Loader2, User, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Logo from "../../public/logo.png";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userSintaLevel?: number;
  userName?: string;
}

export const Header = ({
  userSintaLevel = 2,
  userName = "Dr. Researcher",
}: HeaderProps) => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
  });

  const getSintaStyles = (level: number) => {
    switch (level) {
      case 1: return "bg-indigo-300 text-black border-indigo-900";
      case 2: return "bg-blue-300 text-black border-blue-900";
      case 3: return "bg-teal-300 text-black border-teal-900";
      case 4: return "bg-orange-300 text-black border-orange-900";
      default: return "bg-slate-300 text-black border-slate-900";
    }
  };

  const navLinks = [
    { to: "/explore", label: "Explore" },
    { to: "/data-pool", label: "Data Pool" },
    { to: "/verify", label: "Verify & Earn" },
    { to: "/dao", label: "DAO Vote" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white font-sans">
      <div className="container flex h-20 items-center justify-between px-4 mx-auto">
        
        <div className="flex items-center space-x-4 lg:space-x-8">
          <Link to="/" className="flex items-center space-x-3 cursor-pointer group shrink-0">
            <div className="bg-white p-1.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <img src={Logo} alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-2xl font-black tracking-tighter leading-none">JUDOL</h1>
              <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest border-b-2 border-transparent group-hover:border-black transition-all">
                Journal of Underlying Decentralized Open Ledgers
              </p>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="font-bold border-2 border-transparent hover:border-black hover:bg-yellow-300 hover:text-black rounded-none transition-all hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {/* DESKTOP MINT BUTTON */}
          <Link to="/mint" className="hidden md:block">
            <Button 
              size="sm" 
              className="h-10 bg-black text-white border-2 border-black rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> MINT RESEARCH
            </Button>
          </Link>

          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

              return (
                <div {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                  {(() => {
                    if (!connected) {
                      return (
                        <Button 
                          onClick={openConnectModal} 
                          className="h-10 rounded-none border-2 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          CONNECT
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button onClick={openChainModal} variant="destructive" className="rounded-none border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          WRONG NET
                        </Button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-3">
                        <div className="hidden xl:flex items-center border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <div className={`flex items-center gap-1 px-3 py-1.5 border-r-2 border-black font-bold text-xs ${getSintaStyles(userSintaLevel)}`}>
                                <Sparkles className="h-3 w-3" /> SINTA {userSintaLevel}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100">
                                <Wallet className="h-3.5 w-3.5" />
                                <span className="font-mono font-bold text-sm">
                                    {isBalanceLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        `${balance ? (Number(balance.value) / Math.pow(10, balance.decimals)).toFixed(2) : "0"} USDC`
                                    )}
                                </span>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button onClick={openAccountModal} variant="ghost" className="p-0 h-auto hover:bg-transparent">
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                        <Avatar className="h-10 w-10 border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                            <AvatarImage src="https://github.com/shadcn.png" alt={userName} />
                                            <AvatarFallback className="rounded-none bg-yellow-300 text-black font-bold border-2 border-black">
                                                {userName ? userName.slice(0, 2).toUpperCase() : "US"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            
                            <DropdownMenuContent className="w-56 mt-2 mr-4 rounded-none border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-0" align="end">
                                <div className="p-4 border-b-2 border-black bg-yellow-50">
                                    <p className="font-bold text-sm truncate">{userName}</p>
                                    <p className="text-xs font-mono text-neutral-600 truncate mt-1">{account.displayName}</p>
                                </div>
                                <Link to="/dashboard">
                                    <DropdownMenuItem className="cursor-pointer rounded-none p-3 hover:bg-black hover:text-white font-bold focus:bg-black focus:text-white transition-colors border-b border-neutral-200">
                                        <User className="mr-2 h-4 w-4" /> Your Profile
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem 
                                    className="cursor-pointer rounded-none p-3 text-red-600 font-bold hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white transition-colors"
                                    onClick={() => disconnect()}
                                >
                                    Disconnect Wallet
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* MOBILE MENU DROPDOWN */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none hover:bg-yellow-300 transition-all">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 mr-4 rounded-none border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-2" align="end">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to}>
                    <DropdownMenuItem className="cursor-pointer rounded-none p-3 font-bold hover:bg-yellow-300 hover:text-black focus:bg-yellow-300 focus:text-black border-b border-neutral-100 last:border-0">
                      {link.label}
                    </DropdownMenuItem>
                  </Link>
                ))}
                <div className="p-2 pt-3 border-t-2 border-black mt-1">
                  <Link to="/mint">
                    <Button className="w-full h-10 bg-black text-white border-2 border-black rounded-none font-bold shadow-[2px_2px_0px_0px_rgba(128,128,128,0.5)] hover:bg-white hover:text-black transition-all">
                      <PlusCircle className="mr-2 h-4 w-4" /> MINT PAPER
                    </Button>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isConnected && (
            <Button variant="ghost" size="icon" className="relative hidden md:flex border-2 border-transparent hover:border-black hover:bg-white rounded-none transition-all">
              <Bell className="size-6 text-black" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 border border-black animate-pulse" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};