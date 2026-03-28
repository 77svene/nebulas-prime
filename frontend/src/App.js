import React from 'react';
import WalletProvider from './WalletProvider';
import VaultInterface from './VaultInterface';
import StatsPanel from './StatsPanel';
import './App.css'; // Assuming some basic styling

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <header className="App-header">
          <h1>Nebulas Prime</h1>
          <p>Cross-Chain NFT Liquidity & Yield Aggregator</p>
        </header>
        <main>
          <VaultInterface />
          <StatsPanel />
        </main>
      </div>
    </WalletProvider>
  );
}

export default App;