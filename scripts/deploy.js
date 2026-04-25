import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("Deploying smart contracts to Base/Sepolia...\n");
  
  // Get provider and signer from the network RPC
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org");
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set in .env");
  }
  const signer = new ethers.Wallet(privateKey, provider);
  const deployer = signer;
  
  console.log(`Deploying with account: ${deployer.address}\n`);

  // Load contract ABIs and bytecodes
  const creatorRegistryArtifact = JSON.parse(readFileSync(join(__dirname, "../artifacts/contracts/CreatorRegistry.sol/CreatorRegistry.json"), "utf8"));
  const ipMarketplaceArtifact = JSON.parse(readFileSync(join(__dirname, "../artifacts/contracts/IPMarketplace.sol/IPMarketplace.json"), "utf8"));
  const ipTokenizationArtifact = JSON.parse(readFileSync(join(__dirname, "../artifacts/contracts/IPTokenization.sol/IPTokenization.json"), "utf8"));

  // 1. Deploy CreatorRegistry
  console.log("1. Deploying CreatorRegistry...");
  const CreatorRegistryFactory = new ethers.ContractFactory(creatorRegistryArtifact.abi, creatorRegistryArtifact.bytecode, signer);
  const creatorRegistry = await CreatorRegistryFactory.deploy();
  const creatorRegistryReceipt = await creatorRegistry.deploymentTransaction()?.wait();
  const creatorRegistryAddress = await creatorRegistry.getAddress();
  console.log(`✓ CreatorRegistry deployed to: ${creatorRegistryAddress}\n`);

  // 2. Deploy IPMarketplace
  console.log("2. Deploying IPMarketplace...");
  const IPMarketplaceFactory = new ethers.ContractFactory(ipMarketplaceArtifact.abi, ipMarketplaceArtifact.bytecode, signer);
  const ipMarketplace = await IPMarketplaceFactory.deploy(deployer.address); // Fee collector is deployer
  await ipMarketplace.deploymentTransaction()?.wait();
  const ipMarketplaceAddress = await ipMarketplace.getAddress();
  console.log(`✓ IPMarketplace deployed to: ${ipMarketplaceAddress}\n`);

  // 3. Example: Deploy an IPTokenization contract
  console.log("3. Deploying IPTokenization (example)...");
  const IPTokenizationFactory = new ethers.ContractFactory(ipTokenizationArtifact.abi, ipTokenizationArtifact.bytecode, signer);
  const exampleIP = await IPTokenizationFactory.deploy(
    "AI Music Generator",           // IP Title
    "Fractionalized music generation algorithm",  // Description
    deployer.address,                // Creator
    1000,                            // Initial liquidity (1000 USD)
    1000                             // Initial tokens minted
  );
  await exampleIP.deploymentTransaction()?.wait();
  const exampleIPAddress = await exampleIP.getAddress();
  console.log(`✓ Example IPTokenization deployed to: ${exampleIPAddress}\n`);

  // 4. Create trading pool for the example IP
  console.log("4. Creating trading pool for example IP...");
  const createPoolTx = await ipMarketplace.createPool(
    exampleIPAddress,
    deployer.address,
    1000, // Initial token reserve
    1000  // Initial USD reserve
  );
  await createPoolTx.wait();
  console.log(`✓ Trading pool created\n`);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      CreatorRegistry: creatorRegistryAddress,
      IPMarketplace: ipMarketplaceAddress,
      ExampleIPTokenization: exampleIPAddress,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const deploymentFile = `deployments/${hre.network.name}-deployment.json`;
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${deploymentFile}`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${deploymentFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
