const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseUnits } = ethers.utils;

describe("StrategyRouter", function () {
  let deployer, strategist;
  let strategyRouter;
  let uniswapProvider;
  let aaveProvider;
  let accessManager;
  let mockToken;

  beforeEach(async function () {
    [deployer, strategist] = await ethers.getSigners();

    // Deploy AccessManager
    const AccessManager = await ethers.getContractFactory("AccessManager");
    accessManager = await AccessManager.deploy(deployer.address);
    
    // Deploy StrategyRouter
    const StrategyRouter = await ethers.getContractFactory("StrategyRouter");
    strategyRouter = await StrategyRouter.deploy(
      accessManager.address,
      parseUnits("0.8", 18) // 80% threshold
    );

    // Deploy Providers
    const UniswapProvider = await ethers.getContractFactory("UniswapProvider");
    uniswapProvider = await UniswapProvider.deploy(strategyRouter.address);
    
    const AaveProvider = await ethers.getContractFactory("AaveProvider");
    aaveProvider = await AaveProvider.deploy(strategyRouter.address);

    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("ERC20Mock");
    mockToken = await MockToken.deploy("Mock", "MCK", parseUnits("1000000", 18));
    
    // Set roles
    await accessManager.grantRole(await accessManager.STRATEGIST_ROLE(), strategist.address);
    await strategyRouter.setProvider(0, uniswapProvider.address); // 0 = Uniswap
    await strategyRouter.setProvider(1, aaveProvider.address);   // 1 = Aave
  });

  it("should route to Uniswap when strategy is set to 0", async function () {
    await strategyRouter.connect(strategist).setActiveStrategy(0);
    
    // Deposit tokens
    await mockToken.transfer(strategyRouter.address, parseUnits("1000", 18));
    
    // Execute strategy
    await strategyRouter.connect(strategist).executeStrategy(mockToken.address, parseUnits("500", 18));
    
    // Check Uniswap provider balance
    const balance = await uniswapProvider.liquidityPositions(mockToken.address);
    expect(balance).to.be.gt(0);
  });

  it("should route to Aave when strategy is set to 1", async function () {
    await strategyRouter.connect(strategist).setActiveStrategy(1);
    
    // Deposit tokens
    await mockToken.transfer(strategyRouter.address, parseUnits("1000", 18));
    
    // Execute strategy
    await strategyRouter.connect(strategist).executeStrategy(mockToken.address, parseUnits("500", 18));
    
    // Check Aave provider balance
    const balance = await aaveProvider.lentAmounts(mockToken.address);
    expect(balance).to.be.gt(0);
  });

  it("should generate yield in both strategies", async function () {
    // Set both strategies active
    await strategyRouter.connect(strategist).setActiveStrategy(0);
    await strategyRouter.connect(strategist).setActiveStrategy(1);
    
    // Deposit tokens
    await mockToken.transfer(strategyRouter.address, parseUnits("2000", 18));
    
    // Execute both strategies
    await strategyRouter.connect(strategist).executeStrategy(mockToken.address, parseUnits("1000", 18));
    
    // Simulate yield generation (1% in each)
    await uniswapProvider.simulateYield(mockToken.address, parseUnits("10", 18));
    await aaveProvider.simulateYield(mockToken.address, parseUnits("10", 18));
    
    // Check total yield
    const totalYield = await strategyRouter.getTotalYield(mockToken.address);
    expect(totalYield).to.equal(parseUnits("20", 18));
  });
});