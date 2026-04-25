const hre = require("hardhat");

async function main() {
  console.log("Deploying smart contracts to Base/Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}\n`);

  // 1. Deploy CreatorRegistry
  console.log("1. Deploying CreatorRegistry...");
  const CreatorRegistry = await hre.ethers.getContractFactory("CreatorRegistry");
  const creatorRegistry = await CreatorRegistry.deploy();
  await creatorRegistry.waitForDeployment();
  const creatorRegistryAddress = await creatorRegistry.getAddress();
  console.log(`✓ CreatorRegistry deployed to: ${creatorRegistryAddress}\n`);

  // 2. Deploy IPMarketplace
  console.log("2. Deploying IPMarketplace...");
  const IPMarketplace = await hre.ethers.getContractFactory("IPMarketplace");
  const ipMarketplace = await IPMarketplace.deploy(deployer.address); // Fee collector is deployer
  await ipMarketplace.waitForDeployment();
  const ipMarketplaceAddress = await ipMarketplace.getAddress();
  console.log(`✓ IPMarketplace deployed to: ${ipMarketplaceAddress}\n`);

  // 3. Example: Deploy an IPTokenization contract
  console.log("3. Deploying IPTokenization (example)...");
  const IPTokenization = await hre.ethers.getContractFactory("IPTokenization");
  const exampleIP = await IPTokenization.deploy(
    "AI Music Generator",           // IP Title
    "Fractionalized music generation algorithm",  // Description
    deployer.address,                // Creator
    1000,                            // Initial liquidity (1000 USD)
    1000                             // Initial tokens minted
  );
  await exampleIP.waitForDeployment();
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
  const fs = require("fs");
  const deploymentFile = `deployments/${hre.network.name}-deployment.json`;
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${deploymentFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
