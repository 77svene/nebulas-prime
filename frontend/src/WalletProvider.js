import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, WagmiConfig, chain, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { SafeConnector } from 'wagmi/connectors/safe';

// Configure chains & providers with fallbacks
const { chains, provider, webSocketProvider } = configureChains(
  [chain.mainnet, chain.sepolia, chain.hardhat],
  [
    alchemyProvider({ apiKey: process.env.ALCHEMY_ID }),
    infuraProvider({ apiKey: process.env.INFURA_ID }),
    publicProvider()
  ]
);

// Create wagmi client
const client = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.WALLETCONNECT_PROJECT_ID,
      },
    }),
    new SafeConnector({ chains }),
  ],
  provider,
  webSocketProvider,
});

// Create context
const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    if (client.account) {
      setAddress(client.account.address);
      setIsConnected(!!client.account.address);
      if (client.account.connector) {
        client.account.connector.getSigner().then(setSigner);
      }
    }
  }, [client.account]);

  const connect = async (connector) => {
    try {
      await client.connect({ connector });
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const disconnect = async () => {
    await client.disconnect();
    setAddress(null);
    setIsConnected(false);
    setSigner(null);
  };

  return (
    <WalletContext.Provider value={{ address, isConnected, signer, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;