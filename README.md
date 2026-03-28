**🚀 Nebulas Prime — Cross‑Chain NFT Liquidity & Yield Aggregator**  
*Turning static JPEGs into productive DeFi primitives*

---

### One‑line pitch  
Nebulas Prime lets NFT holders wrap their ERC‑721 assets into yield‑bearing ERC‑1155 “Nebula‑Tokens” while programmatically deploying the underlying floor value into Uniswap V3 LP positions and Aave markets—preserving provenance, utility, and privacy through ZK‑verified floor‑health proofs.

---

## Problem  
High‑value NFTs sit idle in wallets, locking up capital that could be earning yield. Existing NFT‑fi solutions either force full collateralization (losing utility) or require trust‑less custodianship that obscures provenance. Users need a way to:

* Extract liquidity from the NFT floor **without** selling the token.  
* Keep the original NFT’s metadata, royalties, and on‑chain utility intact.  
* Verify solvency privately to satisfy institutional risk parameters.  
* Distribute yield efficiently without O(n) gas costs per holder.

## Solution  Nebulas Prime introduces **Yield‑Bearing NFT Wrappers** (ERC‑1155 Nebula‑Tokens) that represent a claim on the original NFT **plus** accrued yield. The protocol consists of four trust‑minimized subsystems:

1. **Nebula Vault (Core)** – Wraps ERC‑721 → ERC‑1155, mints/burns wrapper tokens, and tracks yield.  2. **Strategy Router** – Uses Chainlink floor prices + ZK‑proofs to prove the NFT’s floor justifies a target debt‑to‑equity ratio before allocating liquidity to Uniswap V3 or Aave.  3. **Liquidation Engine** – Optimistic guardian that monitors health factors; if collateralization < 120 %, triggers a Dutch auction for the underlying NFT.  
4. **Yield Distribution Mesh** – Push‑Pull accumulator that aggregates swap fees & Aave interest and distributes them to holders in O(1) gas per claim.

Zero‑knowledge circuits (`floorProof.circom`) prove **Floor‑Health** without revealing the owner’s full wallet balance, satisfying privacy‑preserving risk checks while enabling composability with any DeFi primitive.

---

### Architecture Diagram (ASCII)

```
+-------------------+        +-------------------+        +-------------------+
|   User Wallet     |        |   Nebula Vault    |        |  Strategy Router  |
| (ERC‑721 NFT)     |<------>| (ERC‑1155 Wrapper)|<------>| (ZK‑FloorProof)   |
+-------------------+        +-------------------+        +-------------------+
          ^                         ^                         ^
          |                         |                         |
          |  Wrap / Unwrap          |  Route Liquidity        |  Verify Floor‑Health
          |                         |                         |
+-------------------+        +-------------------+        +-------------------+
|  Uniswap V3 LP    |        |     Aave Lending  |        |  Liquidation Engine|
| (Swap Fees)       |        | (Interest)        |        | (Dutch Auction)    |
+-------------------+        +-------------------+        +-------------------+
          ^                         ^                         ^
          |                         |                         |
          |  Yield Accumulation     |  Yield Accumulation     |  Health Factor
          |                         |                         |
          +-----------+-------------+-------------+-----------+
                      |                         |
                      v                         v
               +-------------------+   +-------------------+
               | Yield Distribution|   |  Oracle / Chainlink|
               |   Mesh (Push‑Pull) |   |  Floor Price Feed |
               +-------------------+   +-------------------+
```

---

## Setup Instructions  

1. **Clone the repo**  
   ```bash
   git clone https://github.com/77svene/nebulas-prime.git
   cd nebulas-prime
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create a `.env` file** (copy from `.env.example` if present) and fill in the required variables:  

   | Variable                | Description                                                            |
   |-------------------------|------------------------------------------------------------------------|
   | `PRIVATE_KEY`           | Deployer account private key (never commit to git)                     |
   | `RPC_URL`               | Ethereum RPC endpoint (e.g., Alchemy, Infura)                          |
   | `CHAINLINK_FEED_USD`    | Address of the ETH/USD Chainlink aggregator (for floor pricing)       |
   | `AAVE_POOL_ADDRESS`     | Aave V3 Pool contract address                                          |
   | `UNISWAP_FACTORY`       | Uniswap V3 Factory address                                             |
   | `IPFS_PINATA_KEY`       | Pinata API key (for metadata storage)                                  |
   | `IPFS_PINATA_SECRET`    | Pinata secret key                                                      |
   | `VERIFIER_CONTRACT`     | Address of the deployed `ZkVerifier` (after circuit verification)      |

4. **Compile contracts & generate verifiers**  
   ```bash
   npx hardhat compile   npx snarkjs groth16 verify circuits/solvency/floorProof.zkey circuits/solvency/input.json proof.json   ```

5. **Deploy core contracts**  
   ```bash
   npx hardhat run scripts/deploy_core.js --network localhost   # or sepolia/mainnet
   ```

6. **Setup strategies**  
   ```bash
   npx hardhat run scripts/setup_strategies.js --network localhost
   ```

7. **Start the frontend**  
   ```bash
   cd frontend
   npm install
   npm start   # runs on http://localhost:3000
   ```

8. **Run the aggregator services (optional)**  
   ```bash
   cd services/aggregator
   npm install
   node oracleRelay.js   # price feeder
   node yieldScanner.js  # yield harvester   ```

---

## API Endpoints (Aggregator Service)

| Method | Endpoint                     | Description                                                            |
|--------|------------------------------|------------------------------------------------------------------------|
| `GET`  | `/health`                    | Liveness check – returns `{ status: "ok" }`                           |
| `GET`  | `/floor/:collection`         | Returns current floor price (USD) for a given NFT collection          |
| `GET`  | `/strategy/:tokenId`         | Shows the active strategy (Uniswap/Aave) and allocated amount for a Nebula‑Token |
| `GET`  | `/yield/:tokenId`            | Returns accrued yield (in USD) claimable for the holder               |
| `POST` | `/liquidation/:tokenId`      | Triggers liquidation check; if HF < 1.2, initiates Dutch auction      |
| `GET`  | `/metadata/:tokenId`         | Retrieves the wrapped NFT’s metadata (IPFS URI)                       |
| `GET`  | `/events`                    | Streams recent protocol events (wrap, unwrap, yield claim, liquidate) |

*All endpoints return JSON. Authentication is optional for read‑only calls; state‑changing actions require a signed message verified off‑chain.*

---

## Tech Stack Badges  

![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-%23363636)  
![Hardhat](https://img.shields.io/badge/Hardhat-^2.22.0-%23ffdb00)  
![TypeScript](https://img.shields.io/badge/TypeScript-^5.4-%23007ACC)  
![React](https://img.shields.io/badge/React-^18.3-%2361DAFB)  
![Circom](https://img.shields.io/badge/Circom-^2.1.6-%235B5B5B)  
![SnarkJS](https://img.shields.io/badge/SnarkJS-^0.7.0-%23FF6F61)  
![Uniswap V3](https://img.shields.io/badge/Uniswap-V3-%23FF8C00)  
![Aave](https://img.shields.io/badge/Aave-V3-%23EF5350)  
![Chainlink](https://img.shields.io/badge/Chainlink-%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23%23