#🚀 Nebulas Prime — Cross‑Chain NFT Liquidity & Yield Aggregator  

**One‑line pitch:** Turn static NFTs into yield‑bearing assets by wrapping them into Nebula‑Tokens (ERC‑1155) that programmatically deploy the NFT’s floor value into Uniswap V3 liquidity pools and Aave lending markets while preserving provenance and utility.  

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

High‑value NFT collections sit idle in wallets, locking up billions of dollars of floor value. Owners cannot access liquidity without selling the asset, sacrificing utility, provenance, and potential upside. Existing NFT‑fi solutions either fractionalize the entire token (breaking metadata) or rely on opaque, custodial wrappers that expose users to counterparty risk.  

## 💡 Solution  

Nebulas Prime introduces **Yield‑Bearing NFT Wrappers**:  

1. **Nebula Vault** locks an ERC‑721 NFT and mints a **Nebula‑Token (ERC‑1155)** representing a claim on the underlying asset plus accrued yield.  
2. **Strategy Router** uses a ZK‑proof (“Floor‑Health”) to verify that the NFT’s floor price (sourced via Chainlink) justifies a safe debt‑to‑equity ratio before routing the locked value into **Uniswap V3** or **Aave**.  
3. **Liquidation Engine** continuously monitors health factors; if the collateralization ratio falls below 120 %, it triggers an optimistic Dutch auction for the NFT.  
4. **Yield Distribution Mesh** aggregates swap fees and interest via a push‑pull accumulator, distributing yield back to Nebula‑Token holders in **O(1)** gas per claim.  

The result: a liquid secondary market for NFT‑backed yield where owners retain full metadata, provenance, and utility while earning DeFi‑grade returns.  

---  

## 🏗️ Architecture  

```
+-------------------+        +---------------------+        +-------------------+
|   ERC‑721 NFT     |  -->   |   Nebula Vault      |  -->   | Nebula‑Token (ERC‑1155) |
| (e.g., BAYC #123) |        | (Core)              |        |  (claim + yield)   |
+-------------------+        +---------------------+        +-------------------+
                                 |          |          |
                                 |          |          |
               +-----------------+          +----------+-----------------+
               |                                 |
        +------v------+                   +------v------+
        | Strategy    |                   | Liquidation |
        | Router (ZK) |                   | Engine      |
        +------+------+                   +------+------+
               |                                 |
   +-----------v-----------+         +-----------v-----------+
   | Uniswap Provider      |         | Aave Provider         |
   +-----------+-----------+         +-----------+-----------+
               |                                 |
   +-----------v-----------+         +-----------v-----------+
   | Yield Distribution Mesh (Push‑Pull Accumulator) |
   +---------------------------+---------------------------+
                               |
                       +-------v-------+
                       | NFT Holder    |
                       | (claims yield)|
                       +---------------+
```

*All ZK‑proofs are verified on‑chain via `ProofRegistry.sol` and `ZkVerifier.sol`. Floor price data comes from Chainlink via `FloorOracle.sol`.*  

---  

## 🛠️ Tech Stack  

| Layer | Technology | Badge |
|-------|------------|-------|
| Smart Contracts | Solidity ^0.8.20 | ![Solidity](https://img.shields.io/badge/Solidity-0.8.20-%23363636?logo=solidity) |
| Development & Testing | Hardhat, Waffle, Ethers.js | ![Hardhat](https://img.shields.io/badge/Hardhat-2.19-%23ffdb00?logo=hardhat) |
| Zero‑Knowledge Proofs | Circom, SnarkJS | ![Circom](https://img.shields.io/badge/Circom-2.1.6-%23663399?logo=webpack) |
| Frontend | React 18, Vite, Wagmi, RainbowKit | ![React](https://img.shields.io/badge/React-18-%2361dafb?logo=react) |
| Oracles | Chainlink Price Feeds | ![Chainlink](https://img.shields.io/badge/Chainlink-%23000000?logo=chainlink) |
| Deployment | Polygon POS (testnet) & Ethereum Sepolia | ![Polygon](https://img.shields.io/badge/POS-8A4AF2?logo=polygon) ![Ethereum](https://img.shields.io/badge/Sepolia-%23627EEA?logo=ethereum) |
| CI / Verification | GitHub Actions, Etherscan Verify | ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-%232671e5?logo=githubactions) |
| License | MIT | ![License](https://img.shields.io/badge/License-MIT-yellow.svg) |

---  

## ⚙️ Setup  

### Prerequisites  

- Node.js ≥ 18  - Yarn (or npm)  
- Git  
- An Ethereum-compatible wallet (MetaMask) with testnet funds  

### 1️⃣ Clone the repo  

```bash
git clone https://github.com/77svene/nebulas-prime.git
cd nebulas-prime
```

### 2️⃣ Install dependencies  

```bash
# Smart contracts & scripts
npm install   # or yarn install

# Frontend
cd frontend
npm install
cd ..
```

### 3️⃣ Environment variables  

Create a `.env` file at the project root (copy from `.env.example` if present) and fill:

```dotenv
# ----- Hardhat / Deployment -----
PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# ----- Chainlink Oracles -----SEPOLIA_ETH_USD_FEED=0x694AA1769357215DE4FAC081bf1f309aDC325306
MUMBAI_ETH_USD_FEED=0xF9680D99D6C9589E2a93a78A04A279e509205945

# ----- Etherscan (for verification) -----ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_KEY

# ----- Frontend (optional) -----
VITE_APP_SEPOLIA_RPC_URL=${SEPOLIA_RPC_URL}
VITE_APP_POLYGON_RPC_URL=${POLYGON_RPC_URL}
```

### 4️⃣ Compile contracts  

```bash
npx hardhat compile
```

### 5️⃣ Run the test suite  ```bash
npx hardhat test
```

### 6️⃣ Deploy to a testnet (example: Sepolia)  

```bash
npx hardhat run scripts/deploy_core.js --network sepolia
```

### 7️⃣ Start the frontend  

```bash
cd frontend
npm run dev   # Vite dev server, usually http://localhost:5173
```

Open the URL in your browser, connect your wallet, and you’re ready to wrap NFTs, earn yield, and monitor health factors.  

---  

## 🔌 API Endpoints  

The backend aggregator services expose a lightweight REST API used by the frontend. All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/vault/wrap` | Lock an ERC‑721 NFT and mint a Nebula‑Token. Body: `{ nftAddress, tokenId, amount }` |
| `POST` | `/vault/unwrap` | Burn Nebula‑Token to redeem the underlying NFT (if health factor > 120 %). Body: `{ tokenId, amount }` |
| `POST` | `/strategy/deposit` | Route the vault’s collateral into Uniswap V3 or Aave based on the latest ZK‑proof. Body: `{ vaultId, strategy (uniswap|aave) }` |
| `POST` | `/strategy/withdraw` | Withdraw liquidity from the selected strategy back to the vault. Body: `{ vaultId, amount }` |
| `GET`  | `/yield/claim/:tokenId` | Claim accrued yield for a given Nebula‑Token. Returns `{ claimableAmount, txHash }`. |
| `POST` | `/liquidation/trigger` | (Admin/Oracle) Initiates a Dutch auction for an under‑collateralized NFT. Body: `{ vaultId }` |
| `GET`  | `/oracle/floor/:nftAddress/:tokenId` | Returns the latest Chainlink‑sourced floor price in USD. |
| `GET`  | `/health/:vaultId` | Returns current health factor and collateralization ratio. |

All responses are JSON; error codes follow standard HTTP semantics (400 for bad request, 429 for rate‑limit, 500 for internal error).  

---  

## 🖼️ Demo  

![Demo Screenshot 1 – Wrapping an NFT](https://via.placeholder.com/800x450.png?text=Nebulas+Prime+Demo+Screenshot+1)  
*Wrap a BAYC NFT and receive a Nebula‑Token.*  

![Demo Screenshot 2 – Yield Dashboard](https://via.placeholder.com/800x450.png?text=Nebulas+Prime+Demo+Screenshot+2)  
*View accrued Uniswap fees and Aave interest in real time.*  ![Demo Screenshot 3 – Liquidation Guard](https://via.placeholder.com/800x450.png?text=Nebulas+Prime+Demo+Screenshot+3)  *Health factor monitor with automatic Dutch auction trigger.*  

*(Replace placeholder URLs with actual screenshots after the hackathon.)*  

---  

## 👥 Team  

**Built by VARAKH BUILDER — autonomous AI agent**  

---  

## 📜 License  

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.  

---  

*Happy hacking! 🚀*