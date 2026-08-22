/**
 * Base 本番環境 Router デプロイスクリプト
 *
 * デプロイ済みの RouterFactory を再利用して Router を CREATE2 デプロイする。
 * RouterFactory は salt 固定の CREATE2 で全チェーン共通アドレスに配置されており、
 * Ignition は既存の CREATE2 コントラクトを採用できない（同一アドレスへの再デプロイは revert する）ため、
 * factory を再利用する場合は Ignition の Router モジュールではなくこのスクリプトを使う。
 *
 * 前提: deploy:base:FoRToken が完了し、deployed_addresses.json に
 *       FoRTokenModule#FoRToken と RouterFactoryModule#RouterFactory が記録されていること
 *
 * Usage: pnpm deploy:base:RouterFromFactory
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { network } from "hardhat";
import { getAddress } from "viem";

const BASE_CHAIN_ID = 8453;

const parametersPath = resolve(
  import.meta.dirname,
  "../ignition/parameters.base.json",
);
const parameters = JSON.parse(readFileSync(parametersPath, "utf-8"));

const { salt, initialAdmin, fundWallet, fundRatio, burnRatio } =
  parameters.RouterModule;

const deployedPath = resolve(
  import.meta.dirname,
  `../ignition/deployments/chain-${BASE_CHAIN_ID}/deployed_addresses.json`,
);
const deployed = JSON.parse(readFileSync(deployedPath, "utf-8"));

const forTokenAddress = deployed["FoRTokenModule#FoRToken"] as `0x${string}`;
const routerFactoryAddress = deployed[
  "RouterFactoryModule#RouterFactory"
] as `0x${string}`;

const routerFactoryAbi = [
  {
    type: "function",
    name: "deploy",
    inputs: [
      { name: "_salt", type: "bytes32" },
      { name: "_initialAdmin", type: "address" },
      { name: "_forToken", type: "address" },
      { name: "_fundWallet", type: "address" },
      { name: "_fundRatio", type: "uint256" },
      { name: "_burnRatio", type: "uint256" },
    ],
    outputs: [{ name: "addr", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "computeAddress",
    inputs: [
      { name: "_salt", type: "bytes32" },
      { name: "_initialAdmin", type: "address" },
      { name: "_forToken", type: "address" },
      { name: "_fundWallet", type: "address" },
      { name: "_fundRatio", type: "uint256" },
      { name: "_burnRatio", type: "uint256" },
    ],
    outputs: [{ name: "addr", type: "address" }],
    stateMutability: "view",
  },
] as const;

const deployArgs = [
  salt as `0x${string}`,
  getAddress(initialAdmin),
  forTokenAddress,
  getAddress(fundWallet),
  BigInt(fundRatio),
  BigInt(burnRatio),
] as const;

console.log("=== FoR Base Router Deploy ===");
console.log(`FoRToken:       ${forTokenAddress}`);
console.log(`RouterFactory:  ${routerFactoryAddress}`);
console.log(`initialAdmin:   ${getAddress(initialAdmin)}`);
console.log(`fundWallet:     ${getAddress(fundWallet)}`);
console.log(`fundRatio:      ${fundRatio}`);
console.log(`burnRatio:      ${burnRatio}`);

const { viem } = await network.connect("base");
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();

console.log(`Deployer:       ${deployer.account.address}`);

const factoryCode = await publicClient.getCode({
  address: routerFactoryAddress,
});
if (!factoryCode || factoryCode === "0x") {
  console.error(
    `\nError: RouterFactory not found at ${routerFactoryAddress}.`,
    "\nPlease deploy RouterFactory first.",
  );
  process.exit(1);
}

const routerAddress = await publicClient.readContract({
  address: routerFactoryAddress,
  abi: routerFactoryAbi,
  functionName: "computeAddress",
  args: deployArgs,
});

console.log(`\nRouter (computed): ${routerAddress}`);

const existingCode = await publicClient.getCode({ address: routerAddress });
if (existingCode && existingCode !== "0x") {
  console.log("Router is already deployed at this address. Nothing to do.");
  process.exit(0);
}

const hash = await deployer.writeContract({
  address: routerFactoryAddress,
  abi: routerFactoryAbi,
  functionName: "deploy",
  args: deployArgs,
});
console.log(`\nTransaction sent: ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") {
  console.error("Error: Router deployment transaction reverted.");
  process.exit(1);
}

// レシート直後は RPC 側のレプリカ遅延で空が返ることがあるため数回リトライする
let deployedCode = await publicClient.getCode({ address: routerAddress });
for (let i = 0; i < 5 && (!deployedCode || deployedCode === "0x"); i++) {
  await new Promise((r) => setTimeout(r, 2000));
  deployedCode = await publicClient.getCode({ address: routerAddress });
}
if (!deployedCode || deployedCode === "0x") {
  console.error("Error: no code found at the computed Router address.");
  process.exit(1);
}

console.log("\n=== Deploy Complete ===");
console.log(`  Router:  ${routerAddress}`);
console.log(`  Block:   ${receipt.blockNumber}`);
console.log(`  Gas:     ${receipt.gasUsed}`);
console.log("\nNext step: pnpm setup:base");
