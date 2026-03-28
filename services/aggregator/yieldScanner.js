const { ethers } = require("ethers");

/**
 * @title YieldScanner
 * @dev Aggregates real-time yield data from Aave V3 and Uniswap V3.
 */
class YieldScanner {
    constructor(rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl || "https://eth-mainnet.g.alchemy.com/v2/demo");
        
        // Aave V3 UI Pool Data Provider (Mainnet)
        this.AAVE_DATA_PROVIDER = "0x7B4EBb9C211962f5102319675039029179934769";
        // Uniswap V3 Factory
        this.UNI_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    }

    /**
     * Fetches supply APY for a specific asset on Aave V3.
     * @param {string} assetAddress 
     */
    async getAaveYield(assetAddress) {
        try {
            const abi = ["function getReserveData(address asset) external view returns (uint256, uint128, uint128, uint128, uint128, uint128, uint128, uint128, uint128, uint40)"];
            const contract = new ethers.Contract(this.AAVE_DATA_PROVIDER, abi, this.provider);
            const data = await contract.getReserveData(assetAddress);
            
            // liquidityRate is at index 2, expressed in ray (1e27)
            const ray = BigInt(10) ** BigInt(27);
            const supplyApy = (Number(data[2]) / Number(ray)) * 100;
            
            return {
                protocol: "Aave V3",
                asset: assetAddress,
                apy: supplyApy.toFixed(2),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`Aave fetch failed for ${assetAddress}:`, error.message);
            return { protocol: "Aave V3", apy: "0.00", error: "Fetch failed" };
        }
    }

    /**
     * Fetches volume/fee data for a Uniswap V3 pool.
     * Note: Real APY requires historical subgraphs, but we fetch current liquidity state.
     */
    async getUniswapStats(poolAddress) {
        try {
            const abi = [
                "function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
                "function liquidity() external view returns (uint128)"
            ];
            const contract = new ethers.Contract(poolAddress, abi, this.provider);
            const [slot, liquidity] = await Promise.all([
                contract.slot0(),
                contract.liquidity()
            ]);

            return {
                protocol: "Uniswap V3",
                pool: poolAddress,
                currentPrice: slot[0].toString(),
                liquidity: liquidity.toString(),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`Uniswap fetch failed for ${poolAddress}:`, error.message);
            return { protocol: "Uniswap V3", error: "Fetch failed" };
        }
    }

    /**
     * Aggregates all monitored yields.
     */
    async getAllYields() {
        const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        const wethUsdcPool = "0x88e6A0c2dDD26FEEb64F039a2c41296FCB3f5640";

        const [aave, uni] = await Promise.all([
            this.getAaveYield(weth),
            this.getUniswapStats(wethUsdcPool)
        ]);

        return {
            timestamp: new Date().toISOString(),
            yields: [aave, uni]
        };
    }

    /**
     * Real health check verifying RPC connectivity.
     */
    async checkProviderHealth() {
        try {
            const start = Date.now();
            const block = await this.provider.getBlockNumber();
            const latency = Date.now() - start;
            return {
                status: "healthy",
                blockNumber: block,
                latency: `${latency}ms`,
                network: (await this.provider.getNetwork()).name
            };
        } catch (error) {
            return {
                status: "unhealthy",
                error: error.message
            };
        }
    }
}

module.exports = YieldScanner;