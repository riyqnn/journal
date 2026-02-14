import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("===============================================");
  console.log("Deploying JUDOL Research Paper NFT Contract");
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

  // Deploy ResearchPaperNFT
  console.log("\n📦 Deploying ResearchPaperNFT...");
  const ResearchPaperNFT = await hre.ethers.getContractFactory("ResearchPaperNFT");
  const nft = await ResearchPaperNFT.deploy();
  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log("✅ ResearchPaperNFT deployed to:", address);

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("📡 Network:", network.name);
  console.log("⛓️  Chain ID:", network.chainId.toString());

  // Calculate gas used
  const receipt = await nft.deploymentTransaction().wait();
  console.log("⛽ Gas used:", receipt.gasUsed.toString());

  console.log("\n===============================================");
  console.log("Deployment Summary");
  console.log("===============================================");
  console.log("Contract Address:", address);
  console.log("Explorer:", `https://sepolia.arbiscan.io/address/${address}`);
  console.log("\n📝 Add this to your frontend .env file:");
  console.log(`VITE_RESEARCH_PAPER_NFT_ADDRESS=${address}`);
  console.log("===============================================");

  // Verify contract on Arbiscan (if API key is provided)
  if (process.env.ARBITRUM_API_KEY) {
    console.log("\n🔍 Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Arbiscan!");
    } catch (error) {
      console.log("⚠️  Verification failed or already verified:");
      console.log(error.message);
    }
  } else {
    console.log("\n⚠️  Skipping verification (no ARBITRUM_API_KEY provided)");
    console.log("To verify later, run:");
    console.log(`npx hardhat verify --network arbitrumSepolia ${address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
