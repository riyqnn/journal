import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer"; 

export const RootLayout = () => {
    return (
        <div className="relative flex min-h-screen flex-col font-sans antialiased">
            <Header />
            <main className="">
                <Outlet />
            </main>
            <Footer />
            <Toaster /> 
            <ScrollRestoration />
        </div>
    );
};