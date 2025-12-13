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
      deployer.account.address,
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
      deployer.account.address,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    // Deploy Router contract via CREATE2
    const deployHash = await routerFactory.write.deploy(
      [SALT, deployer.account.address, FUND_WALLET, FUND_RATIO, BURN_RATIO],
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
      deployer.account.address,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    const deployHash1 = await routerFactory.write.deploy(
      [SALT_1, deployer.account.address, FUND_WALLET, FUND_RATIO, BURN_RATIO],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash1 });

    // Second deployment with different salt should yield different address
    const SALT_2 = keccak256(toHex("test-deterministic-2"));
    const computedAddress2 = await routerFactory.read.computeAddress([
      SALT_2,
      deployer.account.address,
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
      deployer.account.address,
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
      deployer.account.address,
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
      deployer.account.address,
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
      [SALT_1, deployer.account.address, FUND_WALLET, FUND_RATIO_1, BURN_RATIO_1],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash1 });

    const deployHash2 = await routerFactory.write.deploy(
      [SALT_2, deployer.account.address, FUND_WALLET, FUND_RATIO_2, BURN_RATIO_2],
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
      deployer.account.address,
      TEST_FUND_WALLET,
      TEST_FUND_RATIO,
      TEST_BURN_RATIO,
    ]);

    const deployHash = await routerFactory.write.deploy(
      [SALT_TEST, deployer.account.address, TEST_FUND_WALLET, TEST_FUND_RATIO, TEST_BURN_RATIO],
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

  it("should verify deployed Router has correct AccessControl roles", async () => {
    const SALT_ACCESS = keccak256(toHex("test-access-control"));

    // Deploy Router via Factory
    const routerAddress = await routerFactory.read.computeAddress([
      SALT_ACCESS,
      deployer.account.address,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    const deployHash = await routerFactory.write.deploy(
      [SALT_ACCESS, deployer.account.address, FUND_WALLET, FUND_RATIO, BURN_RATIO],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash });

    // Get Router contract instance
    const router = await viem.getContractAt("Router", routerAddress);

    // Get role identifiers
    const DEFAULT_ADMIN_ROLE = await router.read.DEFAULT_ADMIN_ROLE();
    const FUND_MANAGER_ROLE = await router.read.FUND_MANAGER_ROLE();
    const RATIO_MANAGER_ROLE = await router.read.RATIO_MANAGER_ROLE();

    // Verify deployer has all initial roles
    const hasAdminRole = await router.read.hasRole([
      DEFAULT_ADMIN_ROLE,
      deployer.account.address,
    ]);
    const hasFundManagerRole = await router.read.hasRole([
      FUND_MANAGER_ROLE,
      deployer.account.address,
    ]);
    const hasRatioManagerRole = await router.read.hasRole([
      RATIO_MANAGER_ROLE,
      deployer.account.address,
    ]);

    assert.equal(
      hasAdminRole,
      true,
      "Deployer should have DEFAULT_ADMIN_ROLE",
    );
    assert.equal(
      hasFundManagerRole,
      true,
      "Deployer should have FUND_MANAGER_ROLE",
    );
    assert.equal(
      hasRatioManagerRole,
      true,
      "Deployer should have RATIO_MANAGER_ROLE",
    );
  });

  it("should verify deployed Router Pausable functionality works", async () => {
    const SALT_PAUSABLE = keccak256(toHex("test-pausable"));

    // Deploy Router via Factory
    const routerAddress = await routerFactory.read.computeAddress([
      SALT_PAUSABLE,
      deployer.account.address,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    const deployHash = await routerFactory.write.deploy(
      [SALT_PAUSABLE, deployer.account.address, FUND_WALLET, FUND_RATIO, BURN_RATIO],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash });

    // Get Router contract instance
    const router = await viem.getContractAt("Router", routerAddress);

    // Verify initial state is not paused
    const initialPausedState = await router.read.paused();
    assert.equal(initialPausedState, false, "Router should not be paused initially");

    // Pause the contract
    const pauseHash = await router.write.pause({ account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: pauseHash });

    // Verify paused state
    const pausedState = await router.read.paused();
    assert.equal(pausedState, true, "Router should be paused");

    // Unpause the contract
    const unpauseHash = await router.write.unpause({
      account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: unpauseHash });

    // Verify unpaused state
    const unpausedState = await router.read.paused();
    assert.equal(unpausedState, false, "Router should be unpaused");
  });

  it("should reject operations when deployed Router is paused", async () => {
    const SALT_PAUSED_OPS = keccak256(toHex("test-paused-operations"));

    // Deploy Router via Factory
    const routerAddress = await routerFactory.read.computeAddress([
      SALT_PAUSED_OPS,
      deployer.account.address,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    const deployHash = await routerFactory.write.deploy(
      [SALT_PAUSED_OPS, deployer.account.address, FUND_WALLET, FUND_RATIO, BURN_RATIO],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash });

    // Get Router contract instance
    const router = await viem.getContractAt("Router", routerAddress);

    // Pause the contract
    const pauseHash = await router.write.pause({ account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: pauseHash });

    // Try to set fund ratio while paused - should fail
    await assert.rejects(
      async () => {
        await router.write.setFundRatio([200n], { account: deployer.account });
      },
      (error: Error) => {
        return error.message.includes("EnforcedPause");
      },
      "setFundRatio should fail when paused",
    );

    // Try to set burn ratio while paused - should fail
    await assert.rejects(
      async () => {
        await router.write.setBurnRatio([100n], { account: deployer.account });
      },
      (error: Error) => {
        return error.message.includes("EnforcedPause");
      },
      "setBurnRatio should fail when paused",
    );

    // Try to set fund wallet while paused - should fail
    await assert.rejects(
      async () => {
        await router.write.setFundWallet([deployer.account.address], {
          account: deployer.account,
        });
      },
      (error: Error) => {
        return error.message.includes("EnforcedPause");
      },
      "setFundWallet should fail when paused",
    );
  });

  it("should verify deployed Router AccessControl enforces permissions", async () => {
    const SALT_PERMISSIONS = keccak256(toHex("test-permissions"));
    const [, , unauthorizedUser] = await viem.getWalletClients();

    // Deploy Router via Factory
    const routerAddress = await routerFactory.read.computeAddress([
      SALT_PERMISSIONS,
      deployer.account.address,
      FUND_WALLET,
      FUND_RATIO,
      BURN_RATIO,
    ]);

    const deployHash = await routerFactory.write.deploy(
      [SALT_PERMISSIONS, deployer.account.address, FUND_WALLET, FUND_RATIO, BURN_RATIO],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: deployHash });

    // Get Router contract instance as unauthorized user
    const router = await viem.getContractAt("Router", routerAddress);
    const routerAsUnauthorized = await viem.getContractAt(
      "Router",
      routerAddress,
      {
        client: { wallet: unauthorizedUser },
      },
    );

    // Verify unauthorized user cannot set fund ratio
    await assert.rejects(
      async () => {
        await routerAsUnauthorized.write.setFundRatio([300n]);
      },
      (error: Error) => {
        return error.message.includes("AccessControl");
      },
      "Unauthorized user should not be able to set fund ratio",
    );

    // Verify unauthorized user cannot set burn ratio
    await assert.rejects(
      async () => {
        await routerAsUnauthorized.write.setBurnRatio([150n]);
      },
      (error: Error) => {
        return error.message.includes("AccessControl");
      },
      "Unauthorized user should not be able to set burn ratio",
    );

    // Verify unauthorized user cannot pause
    await assert.rejects(
      async () => {
        await routerAsUnauthorized.write.pause();
      },
      (error: Error) => {
        return error.message.includes("AccessControl");
      },
      "Unauthorized user should not be able to pause",
    );

    // Grant RATIO_MANAGER_ROLE to unauthorized user
    const RATIO_MANAGER_ROLE = await router.read.RATIO_MANAGER_ROLE();
    const grantHash = await router.write.grantRole(
      [RATIO_MANAGER_ROLE, unauthorizedUser.account.address],
      { account: deployer.account },
    );
    await publicClient.waitForTransactionReceipt({ hash: grantHash });

    // Now the user should be able to set fund ratio
    const newFundRatio = 300n;
    const setRatioHash = await routerAsUnauthorized.write.setFundRatio([
      newFundRatio,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: setRatioHash });

    const updatedRatio = await router.read.fundRatio();
    assert.equal(
      updatedRatio,
      newFundRatio,
      "Fund ratio should be updated after granting role",
    );
  });
});
