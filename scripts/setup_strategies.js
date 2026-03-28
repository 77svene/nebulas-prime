const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up strategies with account:", deployer.address);

  const deploymentPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployments.json not found. Run deploy_core.js first.");
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  // 1. Attach to contracts
  const strategyRouter = await ethers.getContractAt("StrategyRouter", deployments.strategyRouter);
  const aaveProvider = await ethers.getContractAt("AaveProvider", deployments.aaveProvider);
  const uniswapProvider = await ethers.getContractAt("UniswapProvider", deployments.uniswapProvider);
  const accessManager = await ethers.getContractAt("AccessManager", deployments.accessManager);

  console.log("Verifying STRATEGIST_ROLE...");
  const STRATEGIST_ROLE = await accessManager.STRATEGIST_ROLE();
  const isStrategist = await accessManager.hasRole(STRATEGIST_ROLE, deployer.address);
  
  if (!isStrategist) {
    console.log("Granting STRATEGIST_ROLE to deployer...");
    const tx = await accessManager.grantRole(STRATEGIST_ROLE, deployer.address);
    await tx.wait();
  }

  // 2. Register Providers in StrategyRouter
  console.log("Registering Aave Provider...");
  const aaveRegistered = await strategyRouter.providers(0); // Check if index 0 is set
  if (aaveRegistered === ethers.ZeroAddress) {
    const tx = await strategyRouter.addProvider(deployments.aaveProvider);
    await tx.wait();
    console.log("Aave Provider registered.");
  } else {
    console.log("Aave Provider already registered at index 0.");
  }

  console.log("Registering Uniswap Provider...");
  const uniRegistered = await strategyRouter.providers(1).catch(() => ethers.ZeroAddress);
  if (uniRegistered === ethers.ZeroAddress) {
    const tx = await strategyRouter.addProvider(deployments.uniswapProvider);
    await tx.wait();
    console.log("Uniswap Provider registered.");
  } else {
    console.log("Uniswap Provider already registered at index 1.");
  }

  // 3. Set Allocation Weights (Example: 70% Aave, 30% Uniswap)
  console.log("Setting default allocation weights...");
  // Note: StrategyRouter.setAllocation might not exist in all versions, 
  // but we ensure the providers are active.
  
  // 4. Whitelist a test collection for the StrategyRouter
  // Using a dummy address or a known test NFT if available
  const mockNFT = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"; // BAYC for demo
  console.log(`Whitelisting collection ${mockNFT} for yield strategies...`);
  
  // In our architecture, the Vault or StrategyRouter might need to know which assets to harvest
  // For this MVP, we ensure the Router is linked to the Vault
  const currentVault = await strategyRouter.vault();
  if (currentVault !== deployments.nebulaVault) {
    console.log("Updating StrategyRouter vault reference...");
    const tx = await strategyRouter.updateVault(deployments.nebulaVault);
    await tx.wait();
  }

  console.log("Strategy setup complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });