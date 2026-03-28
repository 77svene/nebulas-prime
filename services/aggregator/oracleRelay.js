const { ethers } = require("ethers");

/**
 * @title OracleRelay
 * @dev Fetches and normalizes NFT floor prices and protocol debt data.
 * Connects to Chainlink Price Feeds and protocol contracts.
 */
class OracleRelay {
    constructor(rpcUrl, floorOracleAddress) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.floorOracleAddress = floorOracleAddress;
        
        // Minimal ABI for FloorOracle
        this.oracleAbi = [
            "function getFloorPrice(address collection) external view returns (uint256)",
            "function getCollectionThreshold(address collection) external view returns (uint256)"
        ];
    }

    /**
     * @dev Fetches the current floor price for a collection.
     * @param collectionAddress The NFT contract address.
     */
    async getFloorPrice(collectionAddress) {
        try {
            const contract = new ethers.Contract(this.floorOracleAddress, this.oracleAbi, this.provider);
            const price = await contract.getFloorPrice(collectionAddress);
            return price;
        } catch (error) {
            console.error(`[OracleRelay] Error fetching floor for ${collectionAddress}:`, error.message);
            // Fallback to a safe zero if the oracle is unreachable to prevent stale data usage
            throw new Error("ORACLE_UNREACHABLE");
        }
    }

    /**
     * @dev Fetches the liquidation threshold for a specific collection.
     */
    async getThreshold(collectionAddress) {
        try {
            const contract = new ethers.Contract(this.floorOracleAddress, this.oracleAbi, this.provider);
            return await contract.getCollectionThreshold(collectionAddress);
        } catch (error) {
            return 8000n; // Default 80% if not set
        }
    }

    /**
     * @dev Aggregates data required for ZK-Proof generation.
     */
    async getSolvencyContext(collectionAddress, userAddress) {
        const floorPrice = await this.getFloorPrice(collectionAddress);
        const threshold = await this.getThreshold(collectionAddress);
        
        // In a real scenario, we'd fetch the user's debt from the StrategyRouter
        // For MVP, we return the raw floor and threshold for the circuit
        return {
            oracleFloorPrice: floorPrice.toString(),
            liquidationThreshold: threshold.toString()
        };
    }

    /**
     * @dev Health check for the provider and oracle contract.
     */
    async checkHealth() {
        try {
            const block = await this.provider.getBlockNumber();
            const code = await this.provider.getCode(this.floorOracleAddress);
            return {
                status: code !== "0x" ? "healthy" : "degraded",
                blockNumber: block,
                oracleAddress: this.floorOracleAddress
            };
        } catch (error) {
            return { status: "unhealthy", error: error.message };
        }
    }
}

module.exports = OracleRelay;