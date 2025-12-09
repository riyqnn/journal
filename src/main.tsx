import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "./index.css"

// Web3 Imports
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { storyAeneid, story, storyOdyssey } from 'viem/chains' 

// Setup ENV
const projectId = import.meta.env.VITE_PROJECT_ID;
const appName = import.meta.env.VITE_APP_NAME;

if (!projectId) throw new Error("Missing VITE_PROJECT_ID in .env file");

const config = getDefaultConfig({
    appName: appName || "Judol App",
    projectId: projectId,
    chains: [storyAeneid, story, storyOdyssey],
})

// Setup Query Client (Cukup SATU kali disini aja)
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    <App />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>,
)