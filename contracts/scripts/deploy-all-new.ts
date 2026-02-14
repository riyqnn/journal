import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("===============================================");
  console.log("Deploying JUDOL Platform Contracts");
  console.log("===============================================");
  console.log("Deploying with account:", deployer.address);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("\n❌ ERROR: No ETH found in deployer account!");
    console.log("Please get testnet ETH from: https://faucet.quicknode.com/arbitrum/sepolia");
    process.exit(1);
  }

  // Get existing ResearchPaperNFT address from .env
  const existingNFTAddress = process.env.RESEARCH_PAPER_NFT_ADDRESS;
  if (!existingNFTAddress) {
    console.error("\n❌ ERROR: RESEARCH_PAPER_NFT_ADDRESS not set in .env");
    console.log("Please add: RESEARCH_PAPER_NFT_ADDRESS=0x...");
    process.exit(1);
  }
  console.log("\n📋 Using existing ResearchPaperNFT:", existingNFTAddress);

  // Deploy Mock USDC
  console.log("\n📦 Deploying MockUSDC...");
  const initialSupply = 1_000_000 * 10**6; // 1 million USDC (6 decimals)
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy(initialSupply);
  await usdc.waitForDeployment();

  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);
  console.log("   Initial supply:", hre.ethers.formatUnits(initialSupply, 6), "USDC");

  // Deploy GovernanceDAO
  console.log("\n📦 Deploying GovernanceDAO...");
  const GovernanceDAO = await hre.ethers.getContractFactory("GovernanceDAO");
  const governance = await GovernanceDAO.deploy(usdcAddress);
  await governance.waitForDeployment();

  const governanceAddress = await governance.getAddress();
  console.log("✅ GovernanceDAO deployed to:", governanceAddress);

  // Deploy VerifierRegistry
  console.log("\n📦 Deploying VerifierRegistry...");
  const VerifierRegistry = await hre.ethers.getContractFactory("VerifierRegistry");
  const verifierRegistry = await VerifierRegistry.deploy(usdcAddress, existingNFTAddress);
  await verifierRegistry.waitForDeployment();

  const verifierRegistryAddress = await verifierRegistry.getAddress();
  console.log("✅ VerifierRegistry deployed to:", verifierRegistryAddress);

  // Setup: Transfer USDC to VerifierRegistry for rewards
  console.log("\n⚙️  Setting up reward distribution...");
  const rewardPool = 100_000 * 10**6; // 100k USDC for rewards
  const transferTx = await usdc.transfer(verifierRegistryAddress, rewardPool);
  await transferTx.wait();
  console.log("✅ Transferred 100,000 USDC to VerifierRegistry for rewards");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("\n📡 Network:", network.name);
  console.log("⛓️  Chain ID:", network.chainId.toString());

  console.log("\n===============================================");
  console.log("Deployment Summary");
  console.log("===============================================");
  console.log("MockUSDC Address:", usdcAddress);
  console.log("GovernanceDAO Address:", governanceAddress);
  console.log("VerifierRegistry Address:", verifierRegistryAddress);
  console.log("ResearchPaperNFT Address:", existingNFTAddress);
  console.log("\nExplorer Links:");
  console.log(`USDC: https://sepolia.arbiscan.io/address/${usdcAddress}`);
  console.log(`Governance: https://sepolia.arbiscan.io/address/${governanceAddress}`);
  console.log(`VerifierRegistry: https://sepolia.arbiscan.io/address/${verifierRegistryAddress}`);
  console.log("\n📝 Add these to your frontend .env file:");
  console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`VITE_GOVERNANCE_DAO_ADDRESS=${governanceAddress}`);
  console.log(`VITE_VERIFIER_REGISTRY_ADDRESS=${verifierRegistryAddress}`);
  console.log("===============================================");

  // Save to frontend .env file
  const fs = require("fs");
  const envPath = "../judol-fe/.env";
  const envContent = `
# Deployed Contract Addresses
VITE_USDC_ADDRESS=${usdcAddress}
VITE_GOVERNANCE_DAO_ADDRESS=${governanceAddress}
VITE_VERIFIER_REGISTRY_ADDRESS=${verifierRegistryAddress}
`;

  try {
    fs.appendFileSync(envPath, envContent);
    console.log("\n✅ Contract addresses appended to frontend .env file");
  } catch (error) {
    console.log("\n⚠️  Could not auto-update .env file. Please add manually.");
  }

  console.log("\n⏳ Waiting 30 seconds before contract verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  if (process.env.ARBITRUM_API_KEY) {
    console.log("\n🔍 Verifying contracts on Arbiscan...");

    try {
      await hre.run("verify:verify", {
        address: usdcAddress,
        constructorArguments: [initialSupply],
      });
      console.log("✅ MockUSDC verified!");
    } catch (error: any) {
      console.log("⚠️  MockUSDC verification:", error.message?.substring(0, 100));
    }

    try {
      await hre.run("verify:verify", {
        address: governanceAddress,
        constructorArguments: [usdcAddress],
      });
      console.log("✅ GovernanceDAO verified!");
    } catch (error: any) {
      console.log("⚠️  GovernanceDAO verification:", error.message?.substring(0, 100));
    }

    try {
      await hre.run("verify:verify", {
        address: verifierRegistryAddress,
        constructorArguments: [usdcAddress, existingNFTAddress],
      });
      console.log("✅ VerifierRegistry verified!");
    } catch (error: any) {
      console.log("⚠️  VerifierRegistry verification:", error.message?.substring(0, 100));
    }
  } else {
    console.log("\n⚠️  Skipping verification (no ARBITRUM_API_KEY in .env)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
