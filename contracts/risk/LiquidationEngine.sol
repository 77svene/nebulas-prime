// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./HealthFactor.sol";
import "../core/NebulaVault.sol";
import "../core/AccessManager.sol";

/**
 * @title LiquidationEngine
 * @dev Monitors health factors and manages the liquidation of undercollateralized NFTs.
 * Triggers Dutch auctions for NFTs when Health Factor < 1.0.
 */
contract LiquidationEngine is ReentrancyGuard {
    HealthFactor public immutable healthFactor;
    NebulaVault public immutable vault;
    AccessManager public immutable accessManager;

    struct Auction {
        address collection;
        uint256 tokenId;
        uint256 startTime;
        uint256 startPrice;
        bool active;
    }

    // collection => tokenId => Auction
    mapping(address => mapping(uint256 => Auction)) public auctions;
    
    uint256 public constant AUCTION_DURATION = 1 days;
    uint256 public constant MIN_PRICE_BPS = 1000; // 10% of floor

    event LiquidationStarted(address indexed collection, uint256 indexed tokenId, uint256 startPrice);
    event LiquidationSettled(address indexed collection, uint256 indexed tokenId, address indexed buyer, uint256 price);

    constructor(address _healthFactor, address _vault, address _accessManager) {
        healthFactor = HealthFactor(_healthFactor);
        vault = NebulaVault(_vault);
        accessManager = AccessManager(_accessManager);
    }

    /**
     * @dev Starts liquidation for an undercollateralized NFT.
     * Can be called by anyone (incentivized via liquidation fee in production).
     */
    function startLiquidation(address collection, uint256 tokenId) external nonReentrant {
        require(!auctions[collection][tokenId].active, "Auction already active");
        
        uint256 hf = healthFactor.calculateHealthFactor(collection, tokenId);
        require(hf < 1e18, "Position is healthy");

        uint256 floorPrice = healthFactor.oracle().getFloorPrice(collection);
        
        auctions[collection][tokenId] = Auction({
            collection: collection,
            tokenId: tokenId,
            startTime: block.timestamp,
            startPrice: floorPrice,
            active: true
        });

        emit LiquidationStarted(collection, tokenId, floorPrice);
    }

    /**
     * @dev Returns the current price of an NFT in auction.
     */
    function getCurrentPrice(address collection, uint256 tokenId) public view returns (uint256) {
        Auction memory auction = auctions[collection][tokenId];
        if (!auction.active) return 0;

        uint256 elapsed = block.timestamp - auction.startTime;
        if (elapsed >= AUCTION_DURATION) {
            return (auction.startPrice * MIN_PRICE_BPS) / 10000;
        }

        uint256 priceDrop = (auction.startPrice * elapsed) / AUCTION_DURATION;
        uint256 current = auction.startPrice - priceDrop;
        uint256 minPrice = (auction.startPrice * MIN_PRICE_BPS) / 10000;
        
        return current > minPrice ? current : minPrice;
    }

    /**
     * @dev Settles a liquidation by buying the NFT at the current auction price.
     * Buyer pays in ETH, which is used to cover the debt (simulated here by burning NebulaTokens).
     */
    function settleLiquidation(address collection, uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[collection][tokenId];
        require(auction.active, "No active auction");

        uint256 price = getCurrentPrice(collection, tokenId);
        require(msg.value >= price, "Insufficient payment");

        auction.active = false;

        // In a real implementation, the vault would handle the transfer and debt clearing
        // Here we simulate the transfer of the NFT from the vault to the buyer
        vault.liquidateTransfer(collection, tokenId, msg.sender);

        // Refund excess ETH
        if (msg.value > price) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(success, "Refund failed");
        }

        emit LiquidationSettled(collection, tokenId, msg.sender, price);
    }
}