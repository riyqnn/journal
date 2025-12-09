import { useAccount } from "wagmi";
import { Outlet } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Wallet } from "lucide-react";

export const ProtectedLayout = () => {
    const { isConnected } = useAccount();

    if (!isConnected) {
        return (
            <div className="container flex items-center justify-center min-h-screen px-4">
                <Card className="w-full max-w-md text-center border-dashed border-2 shadow-lg">
                    <CardHeader className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center border border-muted-foreground/20">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl">Access Restricted</CardTitle>
                            <CardDescription>
                                You need to connect your Web3 wallet to access this page.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm border border-blue-100 flex items-start gap-3 text-left">
                            <Wallet className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                Features like Minting IP, Voting, and Dashboard require a blockchain signature to verify your identity.
                            </p>
                        </div>

                        <div className="flex justify-center pt-2">
                            {/* Tombol Connect RainbowKit */}
                            <ConnectButton label="Connect Wallet to Continue" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Kalau sudah connect, render halaman aslinya
    return <Outlet />;
};