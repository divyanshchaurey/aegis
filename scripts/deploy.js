const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting SecureAssetPortal Deployment...");
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log(`📡 Network:     ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer:    ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance:     ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy SecureAssetPortal
  console.log("\n📦 Deploying SecureAssetPortal contract...");
  const SecureAssetPortal = await hre.ethers.getContractFactory("SecureAssetPortal");
  const portal = await SecureAssetPortal.deploy();
  await portal.waitForDeployment();

  const contractAddress = await portal.getAddress();
  console.log(`✅ SecureAssetPortal deployed at: ${contractAddress}`);

  // Fetch role hashes
  const DEFAULT_ADMIN_ROLE = await portal.DEFAULT_ADMIN_ROLE();
  const MANAGER_ROLE = await portal.MANAGER_ROLE();
  const AUDITOR_ROLE = await portal.AUDITOR_ROLE();

  console.log("\n🔐 Verified Deployer Permissions:");
  console.log(`   - DEFAULT_ADMIN_ROLE: ${await portal.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)}`);
  console.log(`   - MANAGER_ROLE:       ${await portal.hasRole(MANAGER_ROLE, deployer.address)}`);
  console.log(`   - AUDITOR_ROLE:       ${await portal.hasRole(AUDITOR_ROLE, deployer.address)}`);

  // Export ABI and deployment address to frontend lib/contracts directory
  const contractsDir = path.join(__dirname, "..", "lib", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const contractArtifact = await hre.artifacts.readArtifact("SecureAssetPortal");
  const deploymentInfo = {
    address: contractAddress,
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    roles: {
      DEFAULT_ADMIN_ROLE,
      MANAGER_ROLE,
      AUDITOR_ROLE,
    },
    abi: contractArtifact.abi,
  };

  const outputPath = path.join(contractsDir, "SecureAssetPortal.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment artifact and ABI exported to:\n   ${outputPath}`);

  console.log("==================================================");
  console.log("🎉 Deployment successfully finished!");
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
