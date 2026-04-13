import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { decodeEventLog, getAddress, parseEther, type Address } from "viem";

describe("Router.transferWithDistribution", async () => {
  const { viem } = await network.connect();
  const [deployer, account1, account2, fundWallet] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const NAME = "FoR";
  const SYMBOL = "FOR";
  const INITIAL_SUPPLY = parseEther("1000000");

  const fundRatio = 2000n; // 20%
  const burnRatio = 1000n; // 10%
  const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as Address;
  const DEFAULT_MESSAGE = "thanks";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

  async function ensureAllowListed(token: Awaited<ReturnType<typeof viem.deployContract>>, addresses: Address[]) {
    for (const address of addresses) {
      if (address === ZERO_ADDRESS) {
        continue;
      }

      const isAllowed = await token.read.isAllowListed([address]);
      if (!isAllowed) {
        await token.write.addToAllowList([address]);
      }
    }
  }

  async function allowListBase(token: Awaited<ReturnType<typeof viem.deployContract>>) {
    await ensureAllowListed(token, [
      account1.account.address,
      account2.account.address,
      fundWallet.account.address,
      BURN_ADDRESS,
    ]);
  }

  async function setupTokenAndRouter(ratios?: { fund?: bigint; burn?: bigint }) {
    const forToken = await viem.deployContract("FoRToken", [
      INITIAL_SUPPLY,
      NAME,
      SYMBOL,
    ]);
    const router = await viem.deployContract("Router", [
      deployer.account.address,
      forToken.address,
      fundWallet.account.address,
      ratios?.fund ?? fundRatio,
      ratios?.burn ?? burnRatio,
    ]);
    await allowListBase(forToken);
    return { forToken, router };
  }

  describe("Happy Path", () => {
    it("transfers with pre-approval and distributes correctly", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      // Give account1 tokens
      await forToken.write.transfer([account1.account.address, parseEther("1000")]);

      // Approve router to spend account1's tokens
      const amount = parseEther("100");
      const approveHash = await forToken.write.approve([
        router.address as Address,
        amount,
      ], { account: account1.account });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Execute transferWithDistribution
      const hash = await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });
      await publicClient.waitForTransactionReceipt({ hash });

      // Expected amounts
      const expectedFund = (amount * fundRatio) / 10000n;
      const expectedBurn = (amount * burnRatio) / 10000n;
      const expectedRecipient = amount - expectedFund - expectedBurn;

      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), expectedFund);
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), expectedBurn);
      assert.equal(await forToken.read.balanceOf([account2.account.address]), expectedRecipient);
    });

    it("works with zero ratios (100% recipient)", async () => {
      const { forToken, router } = await setupTokenAndRouter({ fund: 0n, burn: 0n });

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);

      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      assert.equal(await forToken.read.balanceOf([account2.account.address]), amount);
    });

    it("works with maximum ratios (100% total)", async () => {
      const { forToken, router } = await setupTokenAndRouter({ fund: 5000n, burn: 5000n });

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);

      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), parseEther("50"));
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), parseEther("50"));
      assert.equal(await forToken.read.balanceOf([account2.account.address]), 0n);
    });
  });

  describe("Distribution Validation", () => {
    it("sum of parts equals total", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      const fundAmount = await forToken.read.balanceOf([fundWallet.account.address]);
      const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
      const recipientAmount = await forToken.read.balanceOf([account2.account.address]);

      assert.equal(fundAmount + burnAmount + recipientAmount, amount);
    });

    it("handles small amounts (rounding)", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, 1000n]);
      const amount = 10n;
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      const fundAmount = await forToken.read.balanceOf([fundWallet.account.address]);
      const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
      const recipientAmount = await forToken.read.balanceOf([account2.account.address]);

      assert.ok(fundAmount + burnAmount + recipientAmount <= amount);
    });
  });

  describe("Error Handling", () => {
    it("fails with zero amount", async () => {
      const { forToken, router } = await setupTokenAndRouter();
      const amount = 0n;

      await assert.rejects(
        async () => {
          await router.write.transferWithDistribution([
            account1.account.address,
            account2.account.address,
            amount,
            DEFAULT_MESSAGE,
          ], { account: account1.account });
        },
        (error: Error) => error.message.includes("InvalidAmount"),
      );
    });

    it("fails with zero recipient", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      await assert.rejects(
        async () => {
          await router.write.transferWithDistribution([
            account1.account.address,
            "0x0000000000000000000000000000000000000000" as Address,
            amount,
            DEFAULT_MESSAGE,
          ], { account: account1.account });
        },
        (error: Error) => error.message.includes("InvalidRecipient"),
      );
    });

    it("fails with insufficient allowance", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      // No approve

      await assert.rejects(
        async () => {
          await router.write.transferWithDistribution([
            account1.account.address,
            account2.account.address,
            amount,
            DEFAULT_MESSAGE,
          ], { account: account1.account });
        },
        (error: Error) =>
          error.message.includes("ERC20InsufficientAllowance") || error.message.includes("transfer amount exceeds allowance") || error.message.toLowerCase().includes("allowance"),
      );
    });

    it("fails when paused", async () => {
      const { forToken, router } = await setupTokenAndRouter();
      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      await router.write.pause([], { account: deployer.account });

      await assert.rejects(
        async () => {
          await router.write.transferWithDistribution([
            account1.account.address,
            account2.account.address,
            amount,
            DEFAULT_MESSAGE,
          ], { account: account1.account });
        },
        (error: Error) => error.message.includes("EnforcedPause") || error.message.includes("paused"),
      );
    });
  });

  describe("Edge Cases", () => {
    it("from == recipient self transfer with distribution", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      const initialBalance = await forToken.read.balanceOf([account1.account.address]);

      await router.write.transferWithDistribution([
        account1.account.address,
        account1.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      const expectedFundAmount = (amount * fundRatio) / 10000n;
      const expectedBurnAmount = (amount * burnRatio) / 10000n;
      const finalBalance = await forToken.read.balanceOf([account1.account.address]);

      assert.equal(finalBalance, initialBalance - expectedFundAmount - expectedBurnAmount);
    });

    it("handles very large amounts", async () => {
      const { forToken, router } = await setupTokenAndRouter();
      const largeAmount = parseEther("500000");
      await forToken.write.transfer([account1.account.address, largeAmount]);
      await forToken.write.approve([router.address as Address, largeAmount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        largeAmount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      const fundAmount = await forToken.read.balanceOf([fundWallet.account.address]);
      const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
      const recipientAmount = await forToken.read.balanceOf([account2.account.address]);

      assert.equal(fundAmount + burnAmount + recipientAmount, largeAmount);
    });

    it("works with empty message", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      const hash = await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        "",
      ], { account: account1.account });
      await publicClient.waitForTransactionReceipt({ hash });

      const expectedFund = (amount * fundRatio) / 10000n;
      const expectedBurn = (amount * burnRatio) / 10000n;
      const expectedRecipient = amount - expectedFund - expectedBurn;

      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), expectedFund);
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), expectedBurn);
      assert.equal(await forToken.read.balanceOf([account2.account.address]), expectedRecipient);
    });

    it("emits TransferWithDistribution event", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      const tx = await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      const eventLog = receipt.logs.find(
        (log) => log.address.toLowerCase() === router.address.toLowerCase(),
      );

      assert.ok(eventLog, "TransferWithDistribution event should be emitted");

      const decoded = decodeEventLog({
        abi: router.abi,
        data: eventLog.data,
        topics: eventLog.topics,
        eventName: "TransferWithDistribution",
      });

      const expectedFund = (amount * fundRatio) / 10000n;
      const expectedBurn = (amount * burnRatio) / 10000n;
      const expectedRecipient = amount - expectedFund - expectedBurn;

      assert.equal(getAddress(decoded.args.sender), getAddress(account1.account.address));
      assert.equal(getAddress(decoded.args.from), getAddress(account1.account.address));
      assert.equal(getAddress(decoded.args.recipient), getAddress(account2.account.address));
      assert.equal(decoded.args.totalAmount, amount);
      assert.equal(decoded.args.fundAmount, expectedFund);
      assert.equal(decoded.args.burnAmount, expectedBurn);
      assert.equal(decoded.args.recipientAmount, expectedRecipient);
      assert.equal(decoded.args.message, DEFAULT_MESSAGE);
    });
  });
});
