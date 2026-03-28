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
     * @param tokenId The ID of the NFT.
     */
    function deposit(address collection, uint256 tokenId) external nonReentrant {
        IERC721 nft = IERC721(collection);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Not approved");
        
        nft.transferFrom(msg.sender, address(this), tokenId);
        nftOwners[collection][tokenId] = msg.sender;
        
        // Mint 1 share representing the floor value
        nebulaToken.mint(collection, msg.sender, 1);
        
        emit Deposit(collection, tokenId, msg.sender);
    }

    /**
     * @dev Withdraws an NFT from the vault. Burns the corresponding NebulaToken share.
     * @param collection The address of the ERC721 collection.
     * @param tokenId The ID of the NFT.
     */
    function withdraw(address collection, uint256 tokenId) external nonReentrant {
        address owner = nftOwners[collection][tokenId];
        require(owner != address(0), "No deposit found");
        require(owner == msg.sender, "Not owner");
        
        // Burn the share
        uint256 tokenIdUint = uint256(uint160(collection));
        nebulaToken.burn(msg.sender, tokenIdUint, 1);
        
        // Transfer NFT back
        IERC721 nft = IERC721(collection);
        nft.transferFrom(address(this), msg.sender, tokenId);
        delete nftOwners[collection][tokenId];
        
        emit Withdraw(collection, tokenId, msg.sender);
    }

    /**
     * @dev Get the owner of a deposited NFT.
     */
    function getDepositedNftOwner(address collection, uint256 tokenId) external view returns (address) {
        return nftOwners[collection][tokenId];
    }
}