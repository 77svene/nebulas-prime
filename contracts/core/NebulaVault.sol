// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NebulaToken.sol";
import "./AccessManager.sol";

/**
 * @title NebulaVault
 * @dev Core vault for locking NFTs and issuing yield-bearing NebulaTokens.
 */
contract NebulaVault is ERC1155Holder, ReentrancyGuard {
    NebulaToken public immutable nebulaToken;
    AccessManager public immutable accessManager;

    // collection => tokenId => owner
    mapping(address => mapping(uint256 => address)) public nftOwners;
    
    event Deposit(address indexed collection, uint256 indexed tokenId, address indexed user);
    event Withdraw(address indexed collection, uint256 indexed tokenId, address indexed user);

    constructor(address _nebulaToken, address _accessManager) {
        require(_nebulaToken != address(0), "Invalid token address");
        require(_accessManager != address(0), "Invalid access manager");
        nebulaToken = NebulaToken(_nebulaToken);
        accessManager = AccessManager(_accessManager);
    }

    /**
     * @dev Deposits an NFT into the vault and mints 1 NebulaToken share (representing floor).
     * @param collection The address of the ERC721 collection.
     * @param tokenId The ID of the NFT to deposit.
     */
    function deposit(address collection, uint256 tokenId) external nonReentrant {
        IERC721(collection).transferFrom(msg.sender, address(this), tokenId);
        
        nftOwners[collection][tokenId] = msg.sender;
        
        // Mint 10**18 shares per NFT to allow fractional yield distribution
        nebulaToken.mint(collection, msg.sender, 1 ether);
        
        emit Deposit(collection, tokenId, msg.sender);
    }

    /**
     * @dev Withdraws an NFT by burning the corresponding NebulaToken shares.
     * @param collection The address of the ERC721 collection.
     * @param tokenId The ID of the NFT to withdraw.
     */
    function withdraw(address collection, uint256 tokenId) external nonReentrant {
        require(nftOwners[collection][tokenId] == msg.sender, "Not the original depositor");
        
        // User must return the floor value shares to reclaim the specific NFT
        nebulaToken.burn(collection, msg.sender, 1 ether);
        
        delete nftOwners[collection][tokenId];
        IERC721(collection).transferFrom(address(this), msg.sender, tokenId);
        
        emit Withdraw(collection, tokenId, msg.sender);
    }

    /**
     * @dev Emergency liquidation function called by Guardians.
     * Transfers NFT to the liquidation engine or buyer.
     */
    function liquidate(address collection, uint256 tokenId, address recipient) external {
        require(accessManager.isGuardian(msg.sender), "Caller is not a guardian");
        
        address owner = nftOwners[collection][tokenId];
        require(owner != address(0), "NFT not in vault");

        delete nftOwners[collection][tokenId];
        IERC721(collection).transferFrom(address(this), recipient, tokenId);
    }
}