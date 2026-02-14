import React, { createContext, useContext, ReactNode } from 'react';

interface BlockchainEventsContextType {
  // Add any context values if needed
}

const BlockchainEventsContext = createContext<BlockchainEventsContextType>({});

/**
 * Blockchain Events Provider
 * NOTE: Event listeners disabled on Arbitrum Sepolia (eth_newFilter not supported)
 * Use React Query's refetch() method or refetchOnMount instead
 */
export const BlockchainEventsProvider = ({ children }: { children: ReactNode }) => {
  // Event listeners are disabled to prevent RPC spam
  // Use manual refetch via React Query's refetch() method
  console.log("BlockchainEventsProvider: Auto-refresh disabled (use manual refetch)");

  return (
    <BlockchainEventsContext.Provider value={{}}>
      {children}
    </BlockchainEventsContext.Provider>
  );
};

export const useBlockchainEvents = () => useContext(BlockchainEventsContext);

export default BlockchainEventsProvider;
