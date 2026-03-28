// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./StrategyRouter.sol";

/**
 * @title UniswapProvider
 * @dev Minimal provider for Uniswap V3 liquidity. 
 * In a production environment, this would interact with NonfungiblePositionManager.
 * For MVP, we simulate the yield and balance tracking.
 */
contract UniswapProvider is IStrategyProvider {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    address public immutable router;
    uint256 public totalDeposited;
    uint256 public constant SIMULATED_APY = 1200; // 12% in basis points

    constructor(address _asset, address _router) {
        asset = IERC20(_asset);
        router = _router;
    }

    modifier onlyRouter() {
        require(msg.sender == router, "Only router can call");
        _;
    }

    function deposit(uint256 amount) external override onlyRouter {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
    }

    function withdraw(uint256 amount) external override onlyRouter {
        require(totalDeposited >= amount, "Insufficient balance");
        totalDeposited -= amount;
        asset.safeTransfer(msg.sender, amount);
    }

    function getAPY() external pure override returns (uint256) {
        return SIMULATED_APY;
    }

    function getBalance() external view override returns (uint256) {
        return totalDeposited;
    }
}