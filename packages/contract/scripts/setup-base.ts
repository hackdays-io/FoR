/**
 * Base 本番環境セットアップスクリプト
 *
 * デプロイ済みの FoRToken / RouterFactory から Router アドレスを算出し、
 * AllowList の設定と Indexer の設定ファイル更新を行う。
 *
 * 前提: deploy:base:FoRToken, deploy:base:RouterFactory, deploy:base:Router が完了していること
 *
 * Usage: pnpm setup:base
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { network } from "hardhat";
import { getAddress } from "viem";

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";
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

console.log("=== FoR Base Setup ===");
console.log(`FoRToken:       ${forTokenAddress}`);
console.log(`RouterFactory:  ${routerFactoryAddress}`);

const { viem } = await network.connect("base");
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();

console.log(`Deployer:       ${deployer.account.address}`);

const routerAddress = await publicClient.readContract({
  address: routerFactoryAddress,
  abi: [
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
  ] as const,
  functionName: "computeAddress",
  args: [
    salt as `0x${string}`,
    getAddress(initialAdmin),
    forTokenAddress,
    getAddress(fundWallet),
    BigInt(fundRatio),
    BigInt(burnRatio),
  ],
});

console.log(`Router:         ${routerAddress}`);

const routerCode = await publicClient.getCode({ address: routerAddress });
if (!routerCode || routerCode === "0x") {
  console.error(
    "\nError: Router contract not found at computed address.",
    "\nPlease run deploy:base:Router first.",
  );
  process.exit(1);
}

const allowListAddresses = [
  { label: "Router", address: routerAddress },
  { label: "BURN_ADDRESS", address: BURN_ADDRESS as `0x${string}` },
  { label: "fundWallet", address: getAddress(fundWallet) as `0x${string}` },
];

const forTokenAbi = [
  {
    type: "function",
    name: "isAllowListed",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addToAllowList",
    inputs: [{ name: "account", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

console.log("\n=== AllowList Setup ===");

for (const { label, address } of allowListAddresses) {
  const isListed = await publicClient.readContract({
    address: forTokenAddress,
    abi: forTokenAbi,
    functionName: "isAllowListed",
    args: [address],
  });

  if (isListed) {
    console.log(`  ${label} (${address}): already listed`);
    continue;
  }

  const hash = await deployer.writeContract({
    address: forTokenAddress,
    abi: forTokenAbi,
    functionName: "addToAllowList",
    args: [address],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ${label} (${address}): added`);
}

const deployBlock = await publicClient.getBlockNumber();

const indexerConfigPath = resolve(
  import.meta.dirname,
  "../../indexer/config/base.json",
);
const indexerConfig = {
  network: "base",
  routerAddress,
  routerStartBlock: Number(deployBlock),
  forTokenAddress,
  forTokenStartBlock: Number(deployBlock),
};
writeFileSync(indexerConfigPath, `${JSON.stringify(indexerConfig, null, 2)}\n`);
console.log(`\n=== Indexer Config Updated ===`);
console.log(`  ${indexerConfigPath}`);
console.log(`  Router address:   ${routerAddress}`);
console.log(`  FoRToken address: ${forTokenAddress}`);

console.log("\n=== Setup Complete ===");
console.log(`
Next steps:
  1. Update packages/frontend/app/lib/contracts.ts:
       8453: { forToken: "${forTokenAddress}", router: "${routerAddress}" }
  2. Deploy subgraph: cd packages/indexer && pnpm deploy:base
  3. Set frontend env: VITE_CHAIN_ID=8453, VITE_SUBGRAPH_URL, VITE_ALCHEMY_KEY, VITE_PIMLICO_API_KEY
`);
