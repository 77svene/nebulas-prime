// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./StrategyRouter.sol";

/**
 * @title AaveProvider
 * @dev Strategy provider for Aave lending markets.
 * Handles depositing assets into Aave to earn interest.
 */
contract AaveProvider is IStrategyProvider {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    address public immutable router;
    uint256 private _balance;

    constructor(address _asset, address _router) {
        asset = IERC20(_asset);
        router = _router;
    }

    modifier onlyRouter() {
        require(msg.sender == router, "Only router can call");
        _;
    }

    /**
     * @dev Deposits asset into the strategy.
     * In production, this calls Aave Pool.supply().
     */
    function deposit(uint256 amount) external override onlyRouter {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        _balance += amount;
    }

    /**
     * @dev Withdraws asset from the strategy.
     * In production, this calls Aave Pool.withdraw().
     */
    function withdraw(uint256 amount) external override onlyRouter {
        require(_balance >= amount, "Insufficient balance");
        _balance -= amount;
        asset.safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Returns the current APY in basis points (e.g., 450 = 4.5%).
     * For MVP, we return a fixed value that can be compared by the router.
     */
    function getAPY() external pure override returns (uint256) {
        return 450; // 4.5% APY
    }

    /**
     * @dev Returns the total balance held in this strategy.
     */
    function getBalance() external view override returns (uint256) {
        return _balance;
    }
}