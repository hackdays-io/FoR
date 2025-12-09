import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { keccak256, toHex, zeroAddress } from "viem";
import RouterFactory from "../ignition/modules/RouterFactory.js";

describe("RouterFactory", async () => {
  const { ignition, viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  // Deploy RouterFactory once for all tests
  const { routerFactory } = await ignition.deploy(RouterFactory, {
    strategy: "create2",
  });

  // Test parameters
  const FUND_WALLET = deployer.account.address;
  const FUND_RATIO = 100n; // 1%
  const BURN_RATIO = 50n; // 0.5%

  it("should deploy RouterFactory using Ignition with CREATE2 strategy", async () => {
    // Verify the contract is deployed and accessible
    assert.ok(routerFactory);

    // Verify contract has code deployed
    const bytecode = await publicClient.getCode({
      address: routerFactory.address,
    });
    assert.ok(bytecode && bytecode.length > 2); // Contract bytecode should exist
  });

  it("should compute Router address correctly before deployment", async () => {
    const SALT = keccak256(toHex("test-compute-address"));

    // Compute the expected address for the Router
    const computedAddress = await routerFactory.read.computeAddress([
      SALT,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    assert.ok(computedAddress);
    assert.match(computedAddress, /^0x[a-fA-F0-9]{40}$/);
    assert.notEqual(computedAddress.toLowerCase(), zeroAddress.toLowerCase());
  });

  it("should deploy Router via RouterFactory using CREATE2", async () => {
    const SALT = keccak256(toHex("test-deploy-router"));

    // Compute expected address before deployment
    const expectedAddress = await routerFactory.read.computeAddress([
      SALT,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    // Deploy Router contract via CREATE2
    const deployHash = await routerFactory.write.deploy(
      [SALT, FUND_WALLET, FUND_RATIO, BURN_RATIO],
      { account: deployer.account },
    );

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deployHash,
    });
    assert.ok(receipt, "Transaction should be confirmed");

    // Verify the Router was deployed at the expected address
    const bytecode = await publicClient.getCode({ address: expectedAddress });
    assert.ok(
      bytecode && bytecode.length > 2,
      "Router contract should be deployed",
    );
  });

  it("should deploy Router to same address with same parameters (deterministic)", async () => {
    const SALT_1 = keccak256(toHex("test-deterministic-1"));

    // First deployment
    const computedAddress1 = await routerFactory.read.computeAddress([
      SALT_1,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    const deployHash1 = await routerFactory.write.deploy(
      [SALT_1, FUND_WALLET, FUND_RATIO, BURN_RATIO],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash1 });

    // Second deployment with different salt should yield different address
    const SALT_2 = keccak256(toHex("test-deterministic-2"));
    const computedAddress2 = await routerFactory.read.computeAddress([
      SALT_2,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    assert.notEqual(
      computedAddress1.toLowerCase(),
      computedAddress2.toLowerCase(),
      "Different salts should result in different addresses",
    );

    // Same salt with same parameters should give same address
    const computedAddress3 = await routerFactory.read.computeAddress([
      SALT_1,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    assert.equal(
      computedAddress1.toLowerCase(),
      computedAddress3.toLowerCase(),
      "Same salt and parameters should give same address",
    );
  });

  it("should deploy Router with different fund parameters", async () => {
    // Deploy with first set of parameters
    const SALT_1 = keccak256(toHex("test-params-1"));
    const FUND_RATIO_1 = 100n; // 1%
    const BURN_RATIO_1 = 50n; // 0.5%

    const address1 = await routerFactory.read.computeAddress([
      SALT_1,
      FUND_WALLET,
      FUND_RATIO_1,
      BURN_RATIO_1,
    ]);

    // Deploy with second set of parameters
    const SALT_2 = keccak256(toHex("test-params-2"));
    const FUND_RATIO_2 = 200n; // 2%
    const BURN_RATIO_2 = 100n; // 1%

    const address2 = await routerFactory.read.computeAddress([
      SALT_2,
      FUND_WALLET,
      FUND_RATIO_2,
      BURN_RATIO_2,
    ]);

    assert.notEqual(
      address1.toLowerCase(),
      address2.toLowerCase(),
      "Different fund parameters should result in different addresses",
    );

    // Deploy actual contracts
    const deployHash1 = await routerFactory.write.deploy(
      [SALT_1, FUND_WALLET, FUND_RATIO_1, BURN_RATIO_1],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash1 });

    const deployHash2 = await routerFactory.write.deploy(
      [SALT_2, FUND_WALLET, FUND_RATIO_2, BURN_RATIO_2],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash2 });

    // Verify both contracts are deployed
    const bytecode1 = await publicClient.getCode({ address: address1 });
    const bytecode2 = await publicClient.getCode({ address: address2 });

    assert.ok(
      bytecode1 && bytecode1.length > 2,
      "First Router should be deployed",
    );
    assert.ok(
      bytecode2 && bytecode2.length > 2,
      "Second Router should be deployed",
    );
  });

  it("should verify deployed Router contract has correct state variables", async () => {
    const SALT_TEST = keccak256(toHex("test-state-vars"));
    const TEST_FUND_WALLET = deployer.account.address;
    const TEST_FUND_RATIO = 150n;
    const TEST_BURN_RATIO = 75n;

    // Compute and deploy
    const routerAddress = await routerFactory.read.computeAddress([
      SALT_TEST,
      TEST_FUND_WALLET,
      TEST_FUND_RATIO,
      TEST_BURN_RATIO,
    ]);

    const deployHash = await routerFactory.write.deploy(
      [SALT_TEST, TEST_FUND_WALLET, TEST_FUND_RATIO, TEST_BURN_RATIO],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash });

    // Get Router contract instance and verify deployment
    const router = await viem.getContractAt("Router", routerAddress);

    // Verify the Router contract was deployed with correct parameters
    const fundWallet = await router.read.fundWallet();
    const fundRatio = await router.read.fundRatio();
    const burnRatio = await router.read.burnRatio();

    assert.equal(
      fundWallet.toLowerCase(),
      TEST_FUND_WALLET.toLowerCase(),
      "Fund wallet should match",
    );
    assert.equal(fundRatio, TEST_FUND_RATIO, "Fund ratio should match");
    assert.equal(burnRatio, TEST_BURN_RATIO, "Burn ratio should match");

    // Verify the address is not zero
    assert.notEqual(routerAddress.toLowerCase(), zeroAddress.toLowerCase());
  });
});
