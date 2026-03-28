// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FloorOracle.sol";
import "../core/NebulaVault.sol";

/**
 * @title HealthFactor
 * @dev Calculates the health of NFT-backed positions.
 * Health Factor = (Floor Price * Liquidation Threshold) / Debt
 */
contract HealthFactor {
    FloorOracle public immutable floorOracle;
    NebulaVault public immutable vault;

    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80%
    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // 1.0 in WAD
    uint256 public constant BASE = 10000;

    constructor(address _floorOracle, address _vault) {
        floorOracle = FloorOracle(_floorOracle);
        vault = NebulaVault(payable(_vault));
    }

    /**
     * @dev Returns the health factor of a specific NFT position.
     * @param collection NFT collection address.
     * @param debt Outstanding debt against the NFT floor.
     * @return healthFactor The health factor in 18 decimals (WAD).
     */
    function calculateHealthFactor(address collection, uint256 debt) external view returns (uint256) {
        if (debt == 0) return type(uint256).max;

        uint256 floorPrice = floorOracle.getFloorPrice(collection);
        require(floorPrice > 0, "Floor price not available");

        // Collateral Value = Floor Price * 80%
        uint256 collateralValue = (floorPrice * LIQUIDATION_THRESHOLD) / BASE;
        
        // Health Factor = Collateral Value / Debt
        return (collateralValue * 1e18) / debt;
    }

    /**
     * @dev Checks if a position is liquidatable.
     * @param collection NFT collection address.
     * @param debt Outstanding debt.
     * @return isLiquidatable True if health factor < 1.0.
     */
    function isLiquidatable(address collection, uint256 debt) external view returns (bool) {
        if (debt == 0) return false;
        
        uint256 floorPrice = floorOracle.getFloorPrice(collection);
        if (floorPrice == 0) return false;

        uint256 collateralValue = (floorPrice * LIQUIDATION_THRESHOLD) / BASE;
        return (collateralValue * 1e18) < (debt * MIN_HEALTH_FACTOR);
    }
}