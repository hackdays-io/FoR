import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  parseEther,
  toHex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

describe("FoRToken", async () => {
  // ============ Setup ============
  const { viem } = await network.connect();
  const [deployer, account1, account2] = await viem.getWalletClients();

  // ============ Constants ============
  const INITIAL_SUPPLY = parseEther("1000000"); // 1,000,000 FOR
  const NAME = "FoR";
  const SYMBOL = "FOR";

  // Role constants
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
  const ADMIN_ROLE = keccak256(toHex("ADMIN_ROLE"));

  // EIP712 constants
  const DOMAIN_TYPE_HASH = keccak256(
    toHex(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
    ),
  );
  const NAME_HASH = keccak256(toHex(NAME));
  const VERSION_HASH = keccak256(toHex("1"));

  // ============ Helper Functions ============
  const computeDomainSeparator = (
    chainId: bigint,
    verifyingContract: `0x${string}`,
  ) =>
    keccak256(
      encodeAbiParameters(
        [
          { name: "typeHash", type: "bytes32" },
          { name: "nameHash", type: "bytes32" },
          { name: "versionHash", type: "bytes32" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        [DOMAIN_TYPE_HASH, NAME_HASH, VERSION_HASH, chainId, verifyingContract],
      ),
    );

  // ============================================
  // Basic ERC20 Tests
  // ============================================

  it("Should deploy with correct name, symbol, and decimals", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const name = await forToken.read.name();
    const symbol = await forToken.read.symbol();
    const decimals = await forToken.read.decimals();

    assert.equal(name, "FoR");
    assert.equal(symbol, "FOR");
    assert.equal(decimals, 18);
  });

  it("Should mint initial supply to deployer", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);

    const deployerBalance = await forToken.read.balanceOf([
      deployer.account.address,
    ]);
    const totalSupply = await forToken.read.totalSupply();

    assert.equal(deployerBalance, INITIAL_SUPPLY);
    assert.equal(totalSupply, INITIAL_SUPPLY);
  });

  it("Should transfer tokens correctly", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const transferAmount = parseEther("100");

    // Add account1 to allow list before transfer
    await forToken.write.addToAllowList([account1.account.address]);

    await forToken.write.transfer([account1.account.address, transferAmount]);

    const account1Balance = await forToken.read.balanceOf([
      account1.account.address,
    ]);
    const deployerBalance = await forToken.read.balanceOf([
      deployer.account.address,
    ]);

    assert.equal(account1Balance, transferAmount);
    assert.equal(deployerBalance, INITIAL_SUPPLY - transferAmount);
  });

  it("Should emit Transfer event on transfer", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const transferAmount = parseEther("100");
    const publicClient = await viem.getPublicClient();

    // Add account1 to allow list before transfer
    await forToken.write.addToAllowList([account1.account.address]);

    const hash = await forToken.write.transfer([
      account1.account.address,
      transferAmount,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const transferEvent = receipt.logs.find(
      (log) =>
        log.topics[0] ===
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );

    assert.ok(transferEvent, "Transfer event should be emitted");
  });

  it("Should approve and transferFrom correctly", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const approveAmount = parseEther("500");
    const transferAmount = parseEther("200");

    // Add account1 and account2 to allow list
    await forToken.write.addToAllowList([account1.account.address]);
    await forToken.write.addToAllowList([account2.account.address]);

    // Approve account1 to spend deployer's tokens
    await forToken.write.approve([account1.account.address, approveAmount]);

    const allowance = await forToken.read.allowance([
      deployer.account.address,
      account1.account.address,
    ]);
    assert.equal(allowance, approveAmount);

    // Account1 transfers from deployer to account2
    const forTokenAsAccount1 = await viem.getContractAt(
      "FoRToken",
      forToken.address,
      { client: { wallet: account1 } },
    );

    await forTokenAsAccount1.write.transferFrom([
      deployer.account.address,
      account2.account.address,
      transferAmount,
    ]);

    const account2Balance = await forToken.read.balanceOf([
      account2.account.address,
    ]);
    const newAllowance = await forToken.read.allowance([
      deployer.account.address,
      account1.account.address,
    ]);

    assert.equal(account2Balance, transferAmount);
    assert.equal(newAllowance, approveAmount - transferAmount);
  });

  it("Should emit Approval event on approve", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const approveAmount = parseEther("1000");
    const publicClient = await viem.getPublicClient();

    const hash = await forToken.write.approve([
      account1.account.address,
      approveAmount,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const approvalEvent = receipt.logs.find(
      (log) =>
        log.topics[0] ===
        "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    );

    assert.ok(approvalEvent, "Approval event should be emitted");
  });

  it("Should fail when transferring more than balance", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const tooMuch = INITIAL_SUPPLY + 1n;

    // Add account1 to allow list
    await forToken.write.addToAllowList([account1.account.address]);

    await assert.rejects(
      async () => {
        await forToken.write.transfer([account1.account.address, tooMuch]);
      },
      (error: Error) => {
        return error.message.includes("ERC20InsufficientBalance");
      },
    );
  });

  it("Should fail when transferFrom exceeds allowance", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const approveAmount = parseEther("100");
    const transferAmount = parseEther("200");

    // Add account1 and account2 to allow list
    await forToken.write.addToAllowList([account1.account.address]);
    await forToken.write.addToAllowList([account2.account.address]);

    await forToken.write.approve([account1.account.address, approveAmount]);

    const forTokenAsAccount1 = await viem.getContractAt(
      "FoRToken",
      forToken.address,
      { client: { wallet: account1 } },
    );

    await assert.rejects(
      async () => {
        await forTokenAsAccount1.write.transferFrom([
          deployer.account.address,
          account2.account.address,
          transferAmount,
        ]);
      },
      (error: Error) => {
        return error.message.includes("ERC20InsufficientAllowance");
      },
    );
  });

  // ============================================
  // AllowList Integration Tests
  // ============================================

  it("Should complete full AllowList flow with EIP712 signature", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const publicClient = await viem.getPublicClient();

    // 1. Create admin signer (simulating backend/admin wallet)
    const adminPrivateKey = generatePrivateKey();
    const adminAccount = privateKeyToAccount(adminPrivateKey);

    // 2. Grant ADMIN_ROLE to admin signer
    await forToken.write.grantRole([ADMIN_ROLE, adminAccount.address]);

    // 3. Admin signs AllowList request for a new user
    const newUser = account1.account.address;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const chainId = await publicClient.getChainId();

    const domain = {
      name: NAME,
      version: "1",
      chainId: chainId,
      verifyingContract: forToken.address,
    };

    const types = {
      AddToAllowList: [
        { name: "account", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      account: newUser,
      deadline: deadline,
    };

    const signature = await adminAccount.signTypedData({
      domain,
      types,
      primaryType: "AddToAllowList",
      message,
    });

    // 4. New user (or anyone) submits the signature to join AllowList
    const forTokenAsNewUser = await viem.getContractAt(
      "FoRToken",
      forToken.address,
      { client: { wallet: account1 } },
    );

    await forTokenAsNewUser.write.addToAllowListWithSignature([
      newUser,
      deadline,
      signature,
    ]);

    // 5. Verify user is now in AllowList
    const isAllowListed = await forToken.read.isAllowListed([newUser]);
    assert.equal(isAllowListed, true, "User should be in AllowList");

    // 6. User can now receive tokens from deployer
    const transferAmount = parseEther("100");
    await forToken.write.transfer([newUser, transferAmount]);

    const userBalance = await forToken.read.balanceOf([newUser]);
    assert.equal(userBalance, transferAmount, "User should have received tokens");

    // 7. Add another user to AllowList and verify token transfer between users
    await forToken.write.addToAllowList([account2.account.address]);

    await forTokenAsNewUser.write.transfer([
      account2.account.address,
      parseEther("50"),
    ]);

    const account2Balance = await forToken.read.balanceOf([account2.account.address]);
    assert.equal(account2Balance, parseEther("50"), "Account2 should have received tokens from user");
  });

  // ============================================
  // ERC2612 Permit Tests
  // ============================================

  it("Should have correct DOMAIN_SEPARATOR", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const domainSeparator = await forToken.read.DOMAIN_SEPARATOR();

    assert.ok(domainSeparator, "DOMAIN_SEPARATOR should exist");
    assert.equal(
      domainSeparator.length,
      66,
      "DOMAIN_SEPARATOR should be 32 bytes (0x + 64 hex chars)",
    );
    const publicClient = await viem.getPublicClient();

    const expected = computeDomainSeparator(
      BigInt(await publicClient.getChainId()),
      forToken.address,
    );

    assert.equal(
      domainSeparator,
      expected,
      "DOMAIN_SEPARATOR should match EIP-712 domain",
    );
  });

  it("Should return correct nonces", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);

    const initialNonce = await forToken.read.nonces([deployer.account.address]);
    assert.equal(initialNonce, 0n, "Initial nonce should be 0");
  });

  it("Should permit with valid signature", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const publicClient = await viem.getPublicClient();

    const spender = account1.account.address;
    const value = parseEther("1000");
    const nonce = await forToken.read.nonces([deployer.account.address]);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

    // Get domain separator
    const domainSeparator = await forToken.read.DOMAIN_SEPARATOR();
    const chainId = await publicClient.getChainId();
    const expectedDomain = computeDomainSeparator(
      BigInt(chainId),
      forToken.address,
    );
    assert.equal(
      domainSeparator,
      expectedDomain,
      "DOMAIN_SEPARATOR should match computed value",
    );

    // Create EIP-712 domain
    const domain = {
      name: NAME,
      version: "1",
      chainId: chainId,
      verifyingContract: forToken.address,
    };

    // Create permit message
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      owner: deployer.account.address,
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline,
    };

    // Sign the permit
    const signature = await deployer.signTypedData({
      domain,
      types,
      primaryType: "Permit",
      message,
    });

    // Split signature
    const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
    const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
    const v = parseInt(signature.slice(130, 132), 16);

    // Execute permit
    await forToken.write.permit([
      deployer.account.address,
      spender,
      value,
      deadline,
      v,
      r,
      s,
    ]);

    // Check allowance was set
    const allowance = await forToken.read.allowance([
      deployer.account.address,
      spender,
    ]);
    assert.equal(allowance, value, "Allowance should be set via permit");

    // Check nonce was incremented
    const newNonce = await forToken.read.nonces([deployer.account.address]);
    assert.equal(newNonce, nonce + 1n, "Nonce should be incremented");
  });

  it("Should fail permit with expired deadline", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const publicClient = await viem.getPublicClient();

    const spender = account1.account.address;
    const value = parseEther("1000");
    const nonce = await forToken.read.nonces([deployer.account.address]);
    const deadline = BigInt(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago (expired)

    const chainId = await publicClient.getChainId();

    const domain = {
      name: NAME,
      version: "1",
      chainId: chainId,
      verifyingContract: forToken.address,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      owner: deployer.account.address,
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline,
    };

    const signature = await deployer.signTypedData({
      domain,
      types,
      primaryType: "Permit",
      message,
    });

    const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
    const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
    const v = parseInt(signature.slice(130, 132), 16);

    await assert.rejects(
      async () => {
        await forToken.write.permit([
          deployer.account.address,
          spender,
          value,
          deadline,
          v,
          r,
          s,
        ]);
      },
      (error: Error) => {
        return error.message.includes("ERC2612ExpiredSignature");
      },
    );
  });

  it("Should fail permit with invalid signature", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);

    const spender = account1.account.address;
    const value = parseEther("1000");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

    // Use invalid signature components
    const v = 27;
    const r =
      "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
    const s =
      "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

    await assert.rejects(
      async () => {
        await forToken.write.permit([
          deployer.account.address,
          spender,
          value,
          deadline,
          v,
          r,
          s,
        ]);
      },
      (error: Error) => {
        return error.message.includes("ECDSAInvalidSignature");
      },
    );
  });

  // ============================================
  // AccessControl Interface Tests
  // ============================================

  it("Should support AccessControl interface", async () => {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);

    // IAccessControl interface ID: 0x7965db0b
    const supportsInterface = await forToken.read.supportsInterface([
      "0x7965db0b",
    ]);
    assert.equal(supportsInterface, true, "Should support IAccessControl interface");
  });
});
