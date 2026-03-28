// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NebulaToken
 * @dev ERC1155 representing yield-bearing claims on NFT floor value.
 * The tokenId corresponds to the NFT collection address cast to uint256.
 */
contract NebulaToken is ERC1155, Ownable {
    string public name = "Nebulas Prime Yield Token";
    string public symbol = "NPT";

    // Mapping from collection address to total shares minted
    mapping(address => uint256) public totalShares;

    event SharesMinted(address indexed collection, address indexed to, uint256 amount);
    event SharesBurned(address indexed collection, address indexed from, uint256 amount);

    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {}

    /**
     * @dev Mints Nebula tokens representing floor value of a collection.
     * @param collection The address of the underlying NFT collection.
     * @param to Recipient of the tokens.
     * @param amount Amount of shares to mint.
     */
    function mint(address collection, address to, uint256 amount) external onlyOwner {
        require(collection != address(0), "Invalid collection");
        uint256 id = uint256(uint160(collection));
        totalShares[collection] += amount;
        _mint(to, id, amount, "");
        emit SharesMinted(collection, to, amount);
    }

    /**
     * @dev Burns Nebula tokens when withdrawing or liquidating.
     * @param collection The address of the underlying NFT collection.
     * @param from Account to burn from.
     * @param amount Amount of shares to burn.
     */
    function burn(address collection, address from, uint256 amount) external onlyOwner {
        uint256 id = uint256(uint160(collection));
        require(balanceOf(from, id) >= amount, "Insufficient balance");
        totalShares[collection] -= amount;
        _burn(from, id, amount);
        emit SharesBurned(collection, from, amount);
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}