// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IChainlinkNFTOracle {
    function getFloorPrice(address collection) external view returns (uint256);
}

/**
 * @title FloorOracle
 * @dev Aggregates floor price data for NFT collections.
 * In production, this would interface with Chainlink's NFT Floor Price Feeds.
 */
contract FloorOracle is Ownable {
    // Mapping from collection to its specific Chainlink feed or mock value
    mapping(address => uint256) public manualFloors;
    mapping(address => address) public priceFeeds;

    event FloorUpdated(address indexed collection, uint256 price);
    event FeedUpdated(address indexed collection, address feed);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Sets a manual floor price (for testing or collections without feeds).
     * @param collection NFT collection address.
     * @param price Price in ETH (18 decimals).
     */
    function setManualFloor(address collection, uint256 price) external onlyOwner {
        manualFloors[collection] = price;
        emit FloorUpdated(collection, price);
    }

    /**
     * @dev Sets the Chainlink feed address for a collection.
     * @param collection NFT collection address.
     * @param feed Chainlink feed address.
     */
    function setPriceFeed(address collection, address feed) external onlyOwner {
        priceFeeds[collection] = feed;
        emit FeedUpdated(collection, feed);
    }

    /**
     * @dev Returns the floor price of a collection in ETH (18 decimals).
     * @param collection NFT collection address.
     */
    function getFloorPrice(address collection) external view returns (uint256) {
        address feed = priceFeeds[collection];
        if (feed != address(0)) {
            // In production: return IChainlinkNFTOracle(feed).getFloorPrice(collection);
            // For MVP/Hackathon: fallback to manual if feed logic isn't deployed on local node
            return manualFloors[collection];
        }
        uint256 price = manualFloors[collection];
        require(price > 0, "Price not available");
        return price;
    }
}