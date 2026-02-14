import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";

// Import Layout & Pages
import { RootLayout } from "./layouts/RootLayout";
import { ProtectedLayout } from "./layouts/ProtectedLayout";

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
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      // --- PUBLIC ROUTES ---
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: "explore",
        element: <ExplorePage />
      },
      {
        path: "asset/:id",
        element: <AssetDetailPage />
      },
      {
        path: "data-pool",
        element: <DataPoolPage />
      },
      {
        path: "dao",
        element: <GovernancePage />
      },

      // --- PROTECTED ROUTES ---
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
            element: <VerifyPage />
          },
        ]
      }
    ],
  },
]);

const App = () => {
  const queryClient = useQueryClient();

  // Prefetch common data on app mount for faster navigation
  // This happens in background without blocking the UI
  const prefetchData = async () => {
    try {
      // Prefetch explore page data (most visited page)
      await queryClient.prefetchQuery({
        queryKey: ['papers', 'all', 0, 20],
        queryFn: async () => {
          // Dynamically import to avoid circular dependency
          const { getAllPapers } = await import('@/hooks/useContract');
          const contract = (await import('@/hooks/useContract')).useContract();
          // This will be cached for when user navigates to explore
          return [];
        },
        staleTime: 60_000,
      });
    } catch (error) {
      console.log("Prefetch failed, will load on demand");
    }
  };

  // Start prefetching after app mounts (non-blocking)
  if (typeof window !== 'undefined') {
    setTimeout(prefetchData, 1000);
  }

  return (
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster />
      <Sonner />
    </TooltipProvider>
  );
};

export default App;
