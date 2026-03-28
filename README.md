# 🚀 NebulasPrime — The Cross‑Chain NFT Liquidity & Yield Aggregator  
**Turning static JPEGs into productive DeFi primitives**

---

## 🎯 One‑Line Pitch  
Nebulas Prime wraps ERC‑721 NFTs into yield‑bearing ERC‑1155 tokens, letting owners earn Uniswap V3 swap fees and Aave interest while preserving full NFT utility and provenance.

---

## 📖 Table of Contents
- [Problem](#problem)  
- [Solution](#solution)  
- [Architecture](#architecture)  - [Tech Stack](#tech-stack)  - [Setup](#setup)  
- [API Endpoints](#api-endpoints)  
- [Demo](#demo)  
- [Team](#team)  
- [License](#license)  

---

## 🐞 Problem  
High‑value NFT collections sit idle in wallets, locking up capital that could be earning yield. Existing NFT‑fi solutions either:
- **Force full collateralization** (no yield) or  
- **Require surrender of ownership** (loss of utility & provenance).  

Result: **Capital inefficiency** and **limited access** to DeFi yield for NFT holders.

---

## 💡 Solution  
Nebulas Prime introduces **Yield‑Bearing NFT Wrappers (Nebula‑Tokens)**:
1. **Wrap** an ERC‑721 into an ERC‑1155 Nebula‑Token that represents a claim on the underlying NFT **plus accrued yield**.  2. **Route** the NFT’s floor value into **Uniswap V3 concentrated liquidity** or **Aave lending markets** via a **Strategy Router** guarded by **ZK‑proofs** that verify sufficient floor‑price collateral without revealing wallet balances.  
3. **Monitor** health factors with an **optimistic Liquidation Engine** that triggers Dutch auctions if the collateralization ratio falls below 120%.  
4. **Distribute** earned swap fees and interest back to holders through a **Push‑Pull Yield Distribution Mesh** that avoids O(n) gas costs.  

The result: **Liquidity, yield, and privacy** — all while the original NFT remains fully usable (display, transfer, royalties).

---

## 🏗️ Architecture  

```
+-------------------+      +-------------------+      +-------------------+
|   User Wallet     |      |   Frontend (React)|      |   Explorer / UI   |
| (MetaMask, etc.) |<---->| (App.js, Wallet)  |<---->|   (demo.html)     |
+-------------------+      +-------------------+      +-------------------+
          |                         |                         |
          |  JSON‑RPC / WebSocket   |                         |
          v                         v                         v+-------------------+      +-------------------+      +-------------------+
|   Nebula Vault    |      | Strategy Router   |      | Liquidation Engine|
| (NebulaVault.sol) |      | (StrategyRouter.sol)|   | (LiquidationEngine.sol)|
+-------------------+      +-------------------+      +-------------------+
          |                         |                         |
          |  ERC‑1155 (NebulaToken) |                         |
          v                         v                         v
+-------------------+      +-------------------+      +-------------------+
|  Yield Distribution Mesh (Push‑Pull)   |  ZK Verifier & Proof Registry |
| (YieldDistributor.sol)                | (ZkVerifier.sol, ProofRegistry.sol)|
+-------------------+      +-------------------+      +-------------------+
          |                         |                         |
          |  Uniswap V3 LP          |  Aave Lending Market    |
          v                         v                         v
+-------------------+      +-------------------+      +-------------------+
|  UniswapProvider  |      |  AaveProvider     |      |  Chainlink Oracle |
| (UniswapProvider.sol)|   | (AaveProvider.sol) |   | (FloorOracle.sol)   |
+-------------------+      +-------------------+      +-------------------+
```

**Data Flow**  
1. User deposits an NFT → `NebulaVault.wrap()` mints a Nebula‑Token (ERC‑1155).  
2. `StrategyRouter` queries `FloorOracle` (Chainlink) for the NFT floor price, builds a ZK‑circuit input (`floorProof.circom`), and generates a proof proving the floor supports a target debt‑to‑equity ratio.  
3. Proof is verified on‑chain via `ZkVerifier`. If valid, the router calls either `UniswapProvider` or `AaveProvider` to deploy the underlying value into liquidity or lending.  
4. Fees/interest accrue to the vault; `YieldDistributor` uses a push‑pull accumulator to credit holders without iterating over all token IDs.  
5. `HealthFactor` continuously checks collateralization; if < 120%, `LiquidationEngine` initiates a Dutch auction for the NFT, repaying debt and returning any surplus to the user.

---

## 🛠️ Tech Stack  

| Category | Technology | Badge |
|----------|------------|-------|
| **Smart Contracts** | Solidity ^0.8.20 | ![Solidity](https://img.shields.io/badge/Solidity-0.8.20-%23363636?logo=solidity) |
| **Development** | Hardhat, Waffle, Ethers.js | ![Hardhat](https://img.shields.io/badge/Hardhat-2.19-%23ffdb00?logo=hardhat) |
| **Frontend** | React 18, TypeScript, Vite | ![React](https://img.shields.io/badge/React-18-%2361DAFB?logo=react) ![TS](https://img.shields.io/badge/TypeScript-5-%233178C6?logo=typescript) |
| **ZK Proofs** | Circom, SnarkJS, Groth16 | ![Circom](https://img.shields.io/badge/Circom-2.1.6-%235A5A5A?logo=circom) |
| **Oracles** | Chainlink Price Feeds | ![Chainlink](https://img.shields.io/badge/Chainlink-%23000000?logo=chainlink) |
| **DeFi Integrations** | Uniswap V3 SDK, Aave V3 | ![Uniswap](https://img.shields.io/badge/Uniswap-V3-%23FF8C00?logo=uniswap) ![Aave](https://img.shields.io/badge/Aave-V3-%23FF6600?logo=aave) |
| **Testing** | Mocha, Chai, Waffle | ![Mocha](https://img.shields.io/badge/Mocha-10-%238D6748?logo=mocha) |
| **CI / Deploy** | GitHub Actions, Vercel (frontend) | ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-%232088FF?logo=github-actions) |
| **License** | MIT | ![MIT](https://img.shields.io/badge/License-MIT-yellow.svg) |

---

## ⚙️ Setup  

### Prerequisites  
- Node.js ≥ 20  
- Yarn (or npm)  
- Git  
- An Ethereum wallet (MetaMask) with testnet ETH (Sepolia) for testing  

### 1. Clone the repo  
```bash
git clone https://github.com/77svene/nebulas-prime.gitcd nebulas-prime
```

### 2. Install dependencies  
```bash
# Smart contracts & scripts
npm ci   # or yarn install

# Frontend
cd frontend
npm ci
cd ..
```

### 3. Environment variables  
Create a `.env` file at the project root (copy from `.env.example` if present) and fill:

```dotenv
# Ethereum RPC
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/<YOUR_INFURA_PROJECT_ID>"
PRIVATE_KEY="0xYOUR_WALLET_PRIVATE_KEY"   # used by deployment scripts

# API Keys
ETHERSCAN_API_KEY="<YOUR_ETHERSCAN_KEY>"
COINMARKETCAP_API_KEY="<YOUR_CM_KEY>"   # optional for price feeds

# Frontend (optional)
VITE_APP_NAME="Nebulas Prime"
VITE_CHAIN_ID=11155111   # Sepolia```

### 4. Compile contracts  ```bash
npx hardhat compile
```

### 5. Generate ZK proofs (once)  
```bash
cd circuits/solvency
# Generate witness and proof for the sample input
node_modules/.bin/circom floorProof.circom --r1cs --wasm --sym -o build
node_modules/.bin/snarkjs groth16 setup build/floorProof.r1cs build/pot12_final.ptau build/floorProof_0000.zkey
node_modules/.bin/snarkjs groth16 prove build/floorProof_0000.zkey build/floorProof.witness.wtns build/proof.json build/public.json
node_modules/.bin/snarkjs groth16 verify build/pot12_final.ptau build/floorProof_0000.zkey build/proof.json build/public.json
cd ../../..
```

### 6. Deploy to Sepolia (testnet)  ```bash
npx hardhat run scripts/deploy_core.js --network sepolia
npx hardhat run scripts/setup_strategies.js --network sepolia
```

### 7. Run the frontend  
```bash
cd frontend
npm run dev   # Vite dev server, usually http://localhost:5173
```

### 8. Run tests  
```bash
npx hardhat test```

---

## 🔌 API Endpoints  

The frontend talks to a lightweight **Express** aggregator service (`services/aggregator/`) that indexes on‑chain events and serves cached data.  

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/vault/:tokenId` | Returns Nebula‑Token metadata, underlying NFT info, accrued yield, and health factor. | None |
| `GET` | `/api/strategy/:vaultAddress` | Current strategy allocation (Uniswap V3 pool ID, Aave market, debt/equity ratio). | None |
| `POST` | `/api/wrap` | Accepts `{ nftAddress, tokenId }` and returns the minted Nebula‑Token address & transaction hash. | Wallet signature (EIP‑712) |
| `POST` | `/api/unwrap` | Burns Nebula‑Token to reclaim the underlying NFT (if health factor ≥ 1.0). | Wallet signature |
| `GET` | `/api/yield/:tokenId` | Historical yield accrued (swap fees + Aave interest) in ERC‑20 terms. | None |
| `GET` | `/api/liquidations` | List of ongoing/past Dutch auctions (ID, collateral NFT, current price, end time). | None |
| `GET` | `/api/health/:tokenId` | Real‑time health factor and liquidation risk score. | None |
| `POST` | `/api/strategy/set` | (Owner/Admin) updates strategy router parameters (max debt ratio, preferred protocol). | Role‑based (AccessManager) |

*All responses are JSON with `{ success: boolean, data: object, error?: string }`.*

---

## 🖼️ Demo  

![Nebulas Prime Demo Screenshot](./demo.png)  
*Replace `demo.png` with an actual screenshot of the dApp showing a wrapped NFT, yield accrued, and the strategy allocation.*

**Live Demo (Sepolia):** https://nebulas-prime.vercel.app  

---

## 👥 Team  

**Built by VARAKH BUILDER — autonomous AI agent**  *Varakh Builder* is an LLM‑driven development agent that authored the smart contracts, frontend, ZK circuits, and documentation for this hackathon submission.

---

## 📜 License  This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

--- 

*Happy hacking! May your NFTs earn while you sleep.* 🚀