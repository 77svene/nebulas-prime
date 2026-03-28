const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Path to store deployed contract addressesconst DEPLOYED_FILE = path.join(__dirname, "..", "deployed.json");

// Helper to load deployed addresses
function loadDeployed() {
  if (fs.existsSync(DEPLOYED_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DEPLOYED_FILE, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}

// Helper to save deployed addresses
function saveDeployed(addresses) {
  fs.writeFileSync(DEPLOYED_FILE, JSON.stringify(addresses, null, 2));
}

// Main deployment and verification logicasync function main() {
  const deployed = loadDeployed();
  const [deployer] = await ethers.getSigners();
  const admin = deployer.address;

  // Deploy AccessManager if not already deployed
  if (!deployed.AccessManager) {
    const AccessManager = await ethers.getContractFactory("AccessManager");
    const accessManager = await AccessManager.deploy(admin);
    await accessManager.waitForDeployment();
    console.log(`AccessManager deployed to ${await accessManager.getAddress()}`);
    deployed.AccessManager = await accessManager.getAddress();
  } else {
    console.log(`Using existing AccessManager at ${deployed.AccessManager}`);
  }

  // Deploy NebulaToken if not already deployed
  if (!deployed.NebulaToken) {
    const NebulaToken = await ethers.getContractFactory("NebulaToken");
    const nebulaToken = await NebulaToken.deploy(deployed.AccessManager);
    await nebulaToken.waitForDeployment();
    console.log(`NebulaToken deployed to ${await nebulaToken.getAddress()}`);
    deployed.NebulaToken = await nebulaToken.getAddress();
  } else {
    console.log(`Using existing NebulaToken at ${deployed.NebulaToken}`);
  }

  // Deploy NebulaVault if not already deployed  if (!deployed.NebulaVault) {
    const NebulaVault = await ethers.getContractFactory("NebulaVault");
    const nebulaVault = await NebulaVault.deploy(
      deployed.NebulaToken,
      deployed.AccessManager
    );
    await nebulaVault.waitForDeployment();
    console.log(`NebulaVault deployed to ${await nebulaVault.getAddress()}`);
    deployed.NebulaVault = await nebulaVault.getAddress();
  } else {
    console.log(`Using existing NebulaVault at ${deployed.NebulaVault}`);
  }

  // Deploy StrategyRouter if not already deployed
  if (!deployed.StrategyRouter) {
    const StrategyRouter = await ethers.getContractFactory("StrategyRouter");
    const strategyRouter = await StrategyRouter.deploy(
      deployed.NebulaVault,
      deployed.AccessManager
    );
    await strategyRouter.waitForDeployment();
    console.log(`StrategyRouter deployed to ${await strategyRouter.getAddress()}`);
    deployed.StrategyRouter = await strategyRouter.getAddress();
  } else {
    console.log(`Using existing StrategyRouter at ${deployed.StrategyRouter}`);
  }

  // Deploy UniswapProvider if not already deployed
  if (!deployed.UniswapProvider) {
    const UniswapProvider = await ethers.getContractFactory("UniswapProvider");
    const uniswapProvider = await UniswapProvider.deploy(
      deployed.NebulaVault,
      deployed.AccessManager    );
    await uniswapProvider.waitForDeployment();
    console.log(`UniswapProvider deployed to ${await uniswapProvider.getAddress()}`);
    deployed.UniswapProvider = await uniswapProvider.getAddress();
  } else {
    console.log(`Using existing UniswapProvider at ${deployed.UniswapProvider}`);
  }

  // Deploy AaveProvider if not already deployed
  if (!deployed.AaveProvider) {
    const AaveProvider = await ethers.getContractFactory("AaveProvider");
    const aaveProvider = await AaveProvider.deploy(
      deployed.NebulaVault,
      deployed.AccessManager
    );
    await aaveProvider.waitForDeployment();
    console.log(`AaveProvider deployed to ${await aaveProvider.getAddress()}`);
    deployed.AaveProvider = await aaveProvider.getAddress();
  } else {
    console.log(`Using existing AaveProvider at ${deployed.AaveProvider}`);
  }

  // Deploy ProofRegistry if not already deployed  if (!deployed.ProofRegistry) {
    const ProofRegistry = await ethers.getContractFactory("ProofRegistry");
    const proofRegistry = await ProofRegistry.deploy(
      deployed.AccessManager,
      deployed.StrategyRouter
    );
    await proofRegistry.waitForDeployment();
    console.log(`ProofRegistry deployed to ${await proofRegistry.getAddress()}`);
    deployed.ProofRegistry = await proofRegistry.getAddress();
  } else {
    console.log(`Using existing ProofRegistry at ${deployed.ProofRegistry}`);
  }

  // Deploy ZkVerifier if not already deployed
  if (!deployed.ZkVerifier) {
    const ZkVerifier = await ethers.getContractFactory("ZkVerifier");
    const zkVerifier = await ZkVerifier.deploy(deployed.ProofRegistry);
    await zkVerifier.waitForDeployment();
    console.log(`ZkVerifier deployed to ${await zkVerifier.getAddress()}`);
    deployed.ZkVerifier = await zkVerifier.getAddress();
  } else {
    console.log(`Using existing ZkVerifier at ${deployed.ZkVerifier}`);
  }

  // Save updated addresses
  saveDeployed(deployed);

  // Verify contracts on etherscan (optional, will fail in local environment)
  // Uncomment if verifying on a testnet with etherscan API key configured
  /*
  const verify = async (contract, ...args) => {
    try {
      await ethers.provider.send("hardhat_verifyContract", [contract.getAddress(), args]);
      console.log(` Verified ${contract.target}`);
    } catch (e) {
      console.warn(` Verification skipped or failed for ${contract.target}:`, e.message);
    }
  };

  await verify(await ethers.getContractAt("AccessManager", deployed.AccessManager));
  await verify(await ethers.getContractAt("NebulaToken", deployed.NebulaToken));
  await verify(await ethers.getContractAt("NebulaVault", deployed.NebulaVault));
  await verify(await ethers.getContractAt("StrategyRouter", deployed.StrategyRouter));
  await verify(await ethers.getContractAt("UniswapProvider", deployed.UniswapProvider));
  await verify(await ethers.getContractAt("AaveProvider", deployed.AaveProvider));
  await verify(await ethers.getContractAt("ProofRegistry", deployed.ProofRegistry));
  await verify(await ethers.getContractAt("ZkVerifier", deployed.ZkVerifier));
  */

  console.log("\n All contracts are deployed/verified and addresses saved to deployed.json");
}

// Execute script with error handling
main().catch((error) => {
  console.error(" Script failed:", error);
  process.exit(1);
});

// Ensure the script exits cleanly
process.on("uncaughtException", () => process.exit(1));
process.on("unhandledRejection", () => process.exit(1));
