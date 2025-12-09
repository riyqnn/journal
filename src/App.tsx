import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import Layout & Pages
import { RootLayout } from "./layouts/RootLayout";
import { ProtectedLayout } from "./layouts/ProtectedLayout"; // <--- IMPORT INI

import NotFound from "./pages/NotFound";
import LandingPage from "./pages/landingPage/Index";
import ExplorePage from "./pages/explorePage/Index";
import VerifyPage from "./pages/verifyPage/Index";
import DataPoolPage from "./pages/dataPoolPage/Index";
import GovernancePage from "./pages/governancePage/Index";
import MintWizardPage from "./pages/mintWizardPage/Index";
import DashboardPage from "./pages/dashboardPage/Index";
import AssetDetailPage from "./pages/assetDetailPage/Index";

// Definisi Router
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />, // Header & Footer muncul di semua halaman
    errorElement: <NotFound />,
    children: [
      // --- PUBLIC ROUTES (Bisa diakses siapa saja) ---
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: "explore",
        element: <ExplorePage />
      },
      {
        path: "asset/:id", // <-- Dynamic Route :id
        element: <AssetDetailPage />
      },
      {
        path: "data-pool",
        element: <DataPoolPage />
      },
      {
        path: "dao",
        element: <GovernancePage /> // Governance biasanya publik (read-only), votingnya nanti diprotect di tombolnya
      },

      // --- PROTECTED ROUTES (Harus Connect Wallet) ---
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: "mint",
            element: <MintWizardPage />
          },
          {
            path: "dashboard",
            element: <DashboardPage />
          },
          {
            path: "verify",
            element: <VerifyPage /> // Saya sarankan ini diprotect karena butuh interaksi "Vote/Stake"
          },
        ]
      }
    ],
  },
]);

const App = () => {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster />
      <Sonner />
    </TooltipProvider>
  );
};

export default App;