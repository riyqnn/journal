import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "./index.css"

// Web3 Imports
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { arbitrumSepolia } from 'viem/chains'
import { BlockchainEventsProvider } from './contexts/BlockchainEventsContext'

// Setup ENV
const projectId = import.meta.env.VITE_PROJECT_ID;
const appName = import.meta.env.VITE_APP_NAME;

if (!projectId) throw new Error("Missing VITE_PROJECT_ID in .env file");

const config = getDefaultConfig({
    appName: appName || "Judol App",
    projectId: projectId,
    chains: [arbitrumSepolia],
})

// Setup Query Client with optimized settings for performance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000, // 30 seconds
            gcTime: 300_000, // 5 minutes
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
            refetchOnMount: false, // Don't refetch on mount if data is fresh
            refetchOnReconnect: true, // Refetch on reconnect
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <BlockchainEventsProvider>
                    <RainbowKitProvider>
                        <App />
                    </RainbowKitProvider>
                </BlockchainEventsProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>,
)