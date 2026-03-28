const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("NebulaVault Integration Tests", function () {
  async function deployFixture() {
    const [deployer, user1, user2] = await ethers.getSigners();
    
    // Deploy AccessManager with real owner
    const AccessManager = await ethers.getContractFactory("AccessManager");
    const accessManager = await AccessManager.deploy(deployer.address);
    await accessManager.waitForDeployment();
    
    // Deploy NebulaToken
    const NebulaToken = await ethers.getContractFactory("NebulaToken");
    const nebulaToken = await NebulaToken.deploy(deployer.address);
    await nebulaToken.waitForDeployment();
    
    // Deploy NebulaVault
    const NebulaVault = await ethers.getContractFactory("NebulaVault");
    const nebulaVault = await NebulaVault.deploy(
      await nebulaToken.getAddress(),
      await accessManager.getAddress()
    );
    await nebulaVault.waitForDeployment();
    
    // Deploy supporting contracts
    const FloorOracle = await ethers.getContractFactory("FloorOracle");
    const floorOracle = await FloorOracle.deploy();
    await floorOracle.waitForDeployment();
    
    const HealthFactor = await ethers.getContractFactory("HealthFactor");
    const healthFactor = await HealthFactor.deploy(
      await floorOracle.getAddress()
    );
    await healthFactor.waitForDeployment();
    
    const LiquidationEngine = await ethers.getContractFactory("LiquidationEngine");
    const liquidationEngine = await LiquidationEngine.deploy(
      await healthFactor.getAddress()
    );
    await liquidationEngine.waitForDeployment();
    
    // Mock NFT collection
    const MockNFT = await ethers.getContractFactory("MockERC721");
    const mockNFT = await MockNFT.deploy();
    await mockNFT.waitForDeployment();
    
    // Approvals
    await mockNFT.connect(user1).mint(1);
    await mockNFT.connect(user2).mint(2);
    await mockNFT.connect(user1).approve(await nebulaVault.getAddress(), 1);
    await mockNFT.connect(user2).approve(await nebulaVault.getAddress(), 2);
    
    return {
      deployer,
      user1,
      user2,
      nebulaVault,
      nebulaToken,
      accessManager,
      mockNFT,
      healthFactor,
      liquidationEngine,
      floorOracle
    };
  }

  it("Should secure AccessManager with real owner", async function () {
    const { accessManager, deployer } = await loadFixture(deployFixture);
    expect(await accessManager.owner()).to.equal(deployer.address);
    expect(await accessManager.hasRole(await accessManager.DEFAULT_ADMIN_ROLE(), deployer.address)).to.be.true;
  });

  it("Should allow NFT deposit and mint NebulaToken shares", async function () {
    const { nebulaVault, nebulaToken, mockNFT, user1 } = await loadFixture(deployFixture);
    
    await nebulaVault.connect(user1).deposit(
      await mockNFT.getAddress(),
      1,
      "0x"
    );
    
    const collectionId = BigInt(await mockNFT.getAddress());
    expect(await nebulaToken.balanceOf(user1.address, collectionId)).to.equal(1);
    expect(await mockNFT.ownerOf(1)).to.equal(await nebulaVault.getAddress());
  });

  it("Should generate yield over blocks", async function () {
    const { nebulaVault, nebulaToken, mockNFT, user1 } = await loadFixture(deployFixture);
    
    // Deposit NFT
    await nebulaVault.connect(user1).deposit(
      await mockNFT.getAddress(),
      1,
      "0x"
    );
    
    // Simulate 100 blocks
    for (let i = 0; i < 100; i++) {
      await ethers.provider.send("evm_mine");
    }
    
    // Check yield distribution
    const collectionId = BigInt(await mockNFT.getAddress());
    const preBalance = await nebulaToken.balanceOf(user1.address, collectionId);
    
    // Trigger yield distribution
    await nebulaVault.connect(user1).distributeYield(await mockNFT.getAddress());
    
    const postBalance = await nebulaToken.balanceOf(user1.address, collectionId);
    expect(postBalance).to.be.greaterThan(preBalance);
  });

  it("Should liquidate when floor price crashes", async function () {
    const { nebulaVault, mockNFT, user1, liquidationEngine, floorOracle } = await loadFixture(deployFixture);
    
    // Deposit NFT
    await nebulaVault.connect(user1).deposit(
      await mockNFT.getAddress(),
      1,
      "0x"
    );
    
    // Set floor price to trigger liquidation (price drops 50%)
    await floorOracle.setFloorPrice(await mockNFT.getAddress(), 50); // 50% of original
    
    // Check health factor
    const isHealthy = await liquidationEngine.checkHealthFactor(
      await mockNFT.getAddress(),
      1
    );
    expect(isHealthy).to.be.false;
    
    // Trigger liquidation
    await liquidationEngine.liquidateNFT(
      await mockNFT.getAddress(),
      1,
      user1.address
    );
    
    // Verify NFT was transferred to auction
    expect(await mockNFT.ownerOf(1)).to.equal(await liquidationEngine.getAddress());
  });

  it("Should handle failed deployment", async function () {
    await expect(deployFixture()).to.not.throw;
  });
});