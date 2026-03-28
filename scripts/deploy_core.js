const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deploying contracts with account: ${deployer.address} on network: ${network.name}`);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        throw new Error("Deployer has no funds. Deployment aborted.");
    }

    const deploymentsPath = path.join(__dirname, `../deployments_${network.name}.json`);
    let deployments = {};
    if (fs.existsSync(deploymentsPath)) {
        deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    }

    async function deployOrAttach(name, args = []) {
        if (deployments[name]) {
            console.log(`${name} already deployed at: ${deployments[name]}`);
            return await ethers.getContractAt(name, deployments[name]);
        }
        console.log(`Deploying ${name}...`);
        const Factory = await ethers.getContractFactory(name);
        const contract = await Factory.deploy(...args);
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`${name} deployed to: ${address}`);
        deployments[name] = address;
        fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
        return contract;
    }

    try {
        // 1. AccessManager
        const accessManager = await deployOrAttach("AccessManager", [deployer.address]);

        // 2. NebulaToken
        const nebulaToken = await deployOrAttach("NebulaToken", [deployer.address]);

        // 3. NebulaVault
        const nebulaVault = await deployOrAttach("NebulaVault", [
            await nebulaToken.getAddress(),
            await accessManager.getAddress()
        ]);

        // 4. ZkVerifier
        const zkVerifier = await deployOrAttach("ZkVerifier");

        // 5. ProofRegistry
        const proofRegistry = await deployOrAttach("ProofRegistry", [await zkVerifier.getAddress()]);

        // 6. FloorOracle
        const floorOracle = await deployOrAttach("FloorOracle", [await accessManager.getAddress()]);

        // 7. HealthFactor
        const healthFactor = await deployOrAttach("HealthFactor", [
            await floorOracle.getAddress(),
            await proofRegistry.getAddress()
        ]);

        // 8. Linkage: Transfer NebulaToken ownership to Vault if not already done
        const currentTokenOwner = await nebulaToken.owner();
        const vaultAddress = await nebulaVault.getAddress();
        if (currentTokenOwner !== vaultAddress) {
            console.log("Transferring NebulaToken ownership to Vault...");
            const tx = await nebulaToken.transferOwnership(vaultAddress);
            await tx.wait();
            console.log(`Ownership transferred. Hash: ${tx.hash}`);
        }

        console.log("Core deployment and linkage complete.");
    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});