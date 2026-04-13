/**
 * ローカル開発環境セットアップスクリプト
 *
 * デプロイ済みの FoRToken / RouterFactory からRouterアドレスを算出し、
 * AllowListの設定とIndexerの設定ファイル更新を行う。
 *
 * 前提: deploy:local:FoRToken, deploy:local:RouterFactory, deploy:local:Router が完了していること
 *
 * Usage: npx hardhat run scripts/setup-local.ts --network localhost
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { network } from "hardhat";
import { getAddress } from "viem";

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

// parameters.local.json からデプロイパラメータを読み取り
const parametersPath = resolve(
  import.meta.dirname,
  "../ignition/parameters.local.json",
);
const parameters = JSON.parse(readFileSync(parametersPath, "utf-8"));

const { salt, initialAdmin, fundWallet, fundRatio, burnRatio } =
  parameters.RouterModule;

// deployed_addresses.json からデプロイ済みアドレスを読み取り
const deployedPath = resolve(
  import.meta.dirname,
  "../ignition/deployments/chain-31337/deployed_addresses.json",
);
const deployed = JSON.parse(readFileSync(deployedPath, "utf-8"));

const forTokenAddress = deployed["FoRTokenModule#FoRToken"] as `0x${string}`;
const routerFactoryAddress = deployed[
  "RouterFactoryModule#RouterFactory"
] as `0x${string}`;

console.log("=== FoR Local Setup ===");
console.log(`FoRToken:       ${forTokenAddress}`);
console.log(`RouterFactory:  ${routerFactoryAddress}`);

// Hardhat ローカルノードに接続
const { viem } = await network.connect("localhost");
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();

console.log(`Deployer:       ${deployer.account.address}`);

// RouterFactory.computeAddress() で Router アドレスを算出
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

// Router のデプロイ確認
const routerCode = await publicClient.getCode({ address: routerAddress });
if (!routerCode || routerCode === "0x") {
  console.error(
    "\nError: Router contract not found at computed address.",
    "\nPlease run deploy:local:Router first.",
  );
  process.exit(1);
}

// AllowList に追加するアドレスリスト
const allowListAddresses = [
  { label: "Router", address: routerAddress },
  { label: "BURN_ADDRESS", address: BURN_ADDRESS as `0x${string}` },
  { label: "fundWallet", address: getAddress(fundWallet) as `0x${string}` },
];

// Hardhat テスト用アカウント (#1, #2) も追加
const walletClients = await viem.getWalletClients();
for (let i = 1; i <= 2 && i < walletClients.length; i++) {
  allowListAddresses.push({
    label: `Hardhat Account #${i}`,
    address: walletClients[i].account.address,
  });
}

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

// Indexer の localhost.json を更新
const indexerConfigPath = resolve(
  import.meta.dirname,
  "../../indexer/config/localhost.json",
);
const indexerConfig = {
  network: "localhost",
  address: routerAddress,
  startBlock: 0,
};
writeFileSync(indexerConfigPath, `${JSON.stringify(indexerConfig, null, 2)}\n`);
console.log(`\n=== Indexer Config Updated ===`);
console.log(`  ${indexerConfigPath}`);
console.log(`  Router address: ${routerAddress}`);

console.log("\n=== Setup Complete ===");
console.log(`
Next steps:
  1. Confirm Router address above for local setup and indexer config.
  2. Start Graph Node:   pnpm dev:graph
  3. Create subgraph:    cd packages/indexer && pnpm create:localhost
  4. Deploy subgraph:    cd packages/indexer && pnpm deploy:localhost
  5. Create frontend env: cp packages/frontend/.env.example packages/frontend/.env
  6. Update frontend env: set VITE_CHAIN_ID=31337 and VITE_PRIVY_APP_ID=<shared value>
  7. Start frontend:     cd packages/frontend && pnpm dev
`);
