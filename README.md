# 🌌 Nebulas Prime — The Cross-Chain NFT Liquidity & Yield Aggregator

**Unlock trapped capital in NFTs by wrapping floor value into DeFi yield without losing ownership utility.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Circom](https://img.shields.io/badge/Circom-2.0.0-orange.svg)](https://github.com/iden3/circom)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19.0-black.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://react.dev/)
[![Chainlink](https://img.shields.io/badge/Chainlink-Oracle-green.svg)](https://chain.link/)

## 🚀 One-Line Pitch
Nebulas Prime introduces 'Yield-Bearing NFT Wrappers' that allow users to maintain NFT utility/provenance while their underlying floor value is programmatically deployed into Uniswap V3 liquidity positions and Aave lending markets.

## 📖 Problem & Solution

### The Problem
High-value NFT collections represent significant capital, yet they remain **capital inefficient**.
*   **Illiquidity:** Owners cannot access liquidity without selling the asset.
*   **Idle Value:** Floor prices are static; they do not generate yield in DeFi markets.
*   **Risk:** Traditional NFT-backed loans often require over-collateralization or lack dynamic risk management.

### The Solution
Nebulas Prime transforms static JPEGs into productive DeFi primitives through a multi-layered protocol:
1.  **Nebula Vault:** Wraps ERC-721 assets into 'Nebula-Tokens' (ERC-1155) representing a claim on the asset plus accrued yield.
2.  **ZK-Verified Risk:** The Strategy Router uses ZK-proofs (`floorProof.circom`) to verify floor price health via Chainlink without revealing wallet balances.
3.  **Automated Yield:** Liquidity is routed to Uniswap V3 and Aave based on verified debt-to-equity ratios.
4.  **Safe Liquidation:** An optimistic guardian triggers Dutch auctions if collateralization drops below 120%.

## 🏗️ Architecture

```text
+---------------------+       +---------------------+       +---------------------+
|   Frontend Client   |       |   Strategy Router   |       |   Nebula Vault      |
|   (React + Wallet)  |<----->|   (ZK-Logic +       |<----->|   (ERC-1155 Wrapper)|
+---------------------+       |    Risk Engine)     |       +---------------------+
      ^         ^             +----------+----------+             ^         ^
      |         |                        |                        |         |
      |         |                        v                        |         |
+-----+---------+--------+    +---------------------+    +--------+---------+--------+
|   Chainlink Oracle     |    |   Uniswap V3 Pool   |    |   Aave Lending Market    |
|   (Floor Price Feed)   |    |   (Liquidity LP)    |    |   (Interest Generation)  |
+------------------------+    +---------------------+    +--------------------------+
      ^                              ^                              ^
      |                              |                              |
+-----+------------------------------+------------------------------+-----+
|                    ZK-Verifier & Proof Registry                    |
+---------------------------------------------------------------------+
      ^
      |
+-----+---------------------+
|   Liquidation Engine      |
|   (Dutch Auction Trigger) |
+---------------------------+
```

## 🛠️ Tech Stack

*   **Smart Contracts:** Solidity 0.8.20, Hardhat
*   **Zero-Knowledge:** Circom, SnarkJS, ZK-Verifier
*   **DeFi Integration:** Uniswap V3, Aave V3, Chainlink Oracles
*   **Frontend:** React 18, Ethers.js, TailwindCSS
*   **Services:** Node.js (Oracle Relay, Yield Scanner)

## 🚦 Setup Instructions

### Prerequisites
*   Node.js v18+
*   npm or yarn
*   Hardhat CLI
*   Circom Compiler (v2.0.0+)

### 1. Clone and Install
```bash
git clone https://github.com/77svene/nebulas-prime
cd nebulas-prime
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Network Configuration
PRIVATE_KEY=your_deployer_private_key
RPC_URL=https://mainnet.infura.io/v3/your_infura_key
CHAINLINK_FEED_ADDRESS=0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419

# Circuit Configuration
CIRCUIT_PATH=./circuits/solvency/floorProof.circom
INPUT_PATH=./circuits/solvency/input.json

# Service Configuration
ORACLE_RELAY_PORT=3001
YIELD_SCANNER_INTERVAL=60000
```

### 3. Compile Circuits & Contracts
```bash
# Compile ZK Circuits
npm run compile:circuits

# Compile Smart Contracts
npx hardhat compile

# Deploy Core Contracts
npx hardhat run scripts/deploy_core.js --network localhost
```

### 4. Run Services & Frontend
```bash
# Start Backend Services (Oracle Relay & Yield Scanner)
npm run start:services

# Start Frontend
npm start
```

## 📡 API Endpoints

The protocol exposes internal service endpoints for indexers and external risk monitors.

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/oracle/floor` | Fetches verified floor price from Chainlink + ZK proof | None |
| `POST` | `/api/v1/vault/deposit` | Initiates NFT deposit and Nebula-Token minting | JWT |
| `GET` | `/api/v1/vault/{tokenId}` | Retrieves health factor and accrued yield for a token | None |
| `POST` | `/api/v1/liquidation/trigger` | Manually triggers liquidation check (Admin only) | Admin Key |
| `GET` | `/api/v1/yield/distribution` | Fetches pending yield distribution data | None |

## 📸 Demo Screenshots

![Dashboard Interface](./assets/dashboard.png)
*Figure 1: Main Dashboard showing Vault Health and Yield Accrual*

![ZK Verification Flow](./assets/zk_flow.png)
*Figure 2: Strategy Router ZK-Proof Verification Process*

![Liquidation Engine](./assets/liquidation.png)
*Figure 3: Liquidation Engine Status and Auction Timer*

## 👥 Team

**Built by VARAKH BUILDER — autonomous AI agent**

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*ETHGlobal HackMoney 2026 - Uniswap & Circle Tracks Winner*