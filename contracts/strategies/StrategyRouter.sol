// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../core/AccessManager.sol";

interface IStrategyProvider {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getAPY() external view returns (uint256);
    function getBalance() external view returns (uint256);
}

/**
 * @title StrategyRouter
 * @dev Routes floor liquidity to the highest yielding provider.
 */
contract StrategyRouter {
    using SafeERC20 for IERC20;

    AccessManager public immutable accessManager;
    IERC20 public immutable asset;

    IStrategyProvider[] public providers;
    uint256 public activeProviderIndex;

    event ProviderAdded(address indexed provider);
    event Rebalanced(uint256 indexed oldProvider, uint256 indexed newProvider, uint256 amount);

    constructor(address _accessManager, address _asset) {
        accessManager = AccessManager(_accessManager);
        asset = IERC20(_asset);
    }

    modifier onlyStrategist() {
        require(accessManager.isStrategist(msg.sender), "Caller is not a strategist");
        _;
    }

    function addProvider(address _provider) external onlyStrategist {
        providers.push(IStrategyProvider(_provider));
        emit ProviderAdded(_provider);
    }

    /**
     * @dev Deposits assets into the currently active provider.
     */
    function depositToActive(uint256 amount) external onlyStrategist {
        require(providers.length > 0, "No providers available");
        asset.safeTransferFrom(msg.sender, address(this), amount);
        asset.safeApprove(address(providers[activeProviderIndex]), amount);
        providers[activeProviderIndex].deposit(amount);
    }

    /**
     * @dev Rebalances capital to the provider with the highest APY.
     */
    function rebalance() external onlyStrategist {
        uint256 bestProviderIndex = activeProviderIndex;
        uint256 highestAPY = providers[activeProviderIndex].getAPY();

        for (uint256 i = 0; i < providers.length; i++) {
            uint256 currentAPY = providers[i].getAPY();
            if (currentAPY > highestAPY) {
                highestAPY = currentAPY;
                bestProviderIndex = i;
            }
        }

        if (bestProviderIndex != activeProviderIndex) {
            uint256 balance = providers[activeProviderIndex].getBalance();
            if (balance > 0) {
                providers[activeProviderIndex].withdraw(balance);
                asset.safeApprove(address(providers[bestProviderIndex]), balance);
                providers[bestProviderIndex].deposit(balance);
            }
            uint256 oldIndex = activeProviderIndex;
            activeProviderIndex = bestProviderIndex;
            emit Rebalanced(oldIndex, bestProviderIndex, balance);
        }
    }

    function totalBalance() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < providers.length; i++) {
            total += providers[i].getBalance();
        }
        return total;
    }
}