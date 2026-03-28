const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// File to persist deployment addresses
const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployment.json");

async function loadDeployment() {
  try {
    const data = fs.readFileSync(DEPLOYMENT_FILE);
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveDeployment(deployments) {
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deployments, null, 2));
}

async function deployContractIfNotExists(deployments, contractName, args = []) {
  if (deployments[contractName]) {
    console.log(`Using existing ${contractName} at ${deployments[contractName]}`);
    return await hre.ethers.getContractAt(contractName, deployments[contractName]);
  }

  try {
    console.log(`Deploying ${contractName}...`);
    const Contract = await hre.ethers.getContractFactory(contractName);
    const contract = await Contract.deploy(...args);
    await contract.deployed();
    deployments[contractName] = contract.address;
    await saveDeployment(deployments);
    console.log(`${contractName} deployed to ${contract.address}`);
    return contract;
  } catch (error) {
    console.error(`Failed to deploy ${contractName}: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const deployments = await loadDeployment();
  
  // 1. Deploy AccessManager first
  const adminAddress = (await hre.ethers.getSigners())[0].address;
  const accessManager = await deployContractIfNotExists(deployments, "AccessManager", [adminAddress]);
  
  // 2. Deploy NebulaToken
  const nebulaToken = await deployContractIfNotExists(deployments, "NebulaToken", [accessManager.address]);
  
  // 3. Deploy ProofRegistry with verified accessManager
  const proofRegistry = await deployContractIfNotExists(deployments, "ProofRegistry", [accessManager.address]);
  
  // 4. Deploy other core contracts
  const floorOracle = await deployContractIfNotExists(deployments, "FloorOracle", [accessManager.address]);
  const healthFactor = await deployContractIfNotExists(deployments, "HealthFactor", [accessManager.address]);
  const liquidationEngine = await deployContractIfNotExists(deployments, "LiquidationEngine", [accessManager.address]);
  
  // 5. Deploy strategy router with core dependencies
  const strategyRouter = await deployContractIfNotExists(deployments, "StrategyRouter", [
    accessManager.address,
    floorOracle.address,
    healthFactor.address
  ]);

  // Verify deployment sequence
  console.log("\nDeployment Summary:");
  console.log(`AccessManager: ${accessManager.address}`);
  console.log(`NebulaToken: ${nebulaToken.address}`);
  console.log(`ProofRegistry: ${proofRegistry.address}`);
  console.log(`FloorOracle: ${floorOracle.address}`);
  console.log(`HealthFactor: ${healthFactor.address}`);
  console.log(`LiquidationEngine: ${liquidationEngine.address}`);
  console.log(`StrategyRouter: ${strategyRouter.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  });