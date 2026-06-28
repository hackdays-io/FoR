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

  // 上乗せ方式の期待値。amount = 受取人が受け取る額、totalAmount = from が支払う合計。
  // 基金・Burn は amount に対して計算され、合計に上乗せされる。
  function expectedDistribution(amount: bigint, fund = fundRatio, burn = burnRatio) {
    const fundAmount = (amount * fund) / 10000n;
    const burnAmount = (amount * burn) / 10000n;
    return {
      fundAmount,
      burnAmount,
      recipientAmount: amount,
      totalAmount: amount + fundAmount + burnAmount,
    };
  }

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

      // account1 = 受取人が受け取る額。合計（上乗せ込み）を approve する。
      const amount = parseEther("100");
      const { fundAmount, burnAmount, totalAmount } = expectedDistribution(amount);
      const approveHash = await forToken.write.approve([
        router.address as Address,
        totalAmount,
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

      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), fundAmount);
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), burnAmount);
      // 受取人は amount をそのまま受け取る
      assert.equal(await forToken.read.balanceOf([account2.account.address]), amount);
    });

    it("works with zero ratios (no markup)", async () => {
      const { forToken, router } = await setupTokenAndRouter({ fund: 0n, burn: 0n });

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);

      const amount = parseEther("100");
      // 上乗せなしなので合計 = amount
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      assert.equal(await forToken.read.balanceOf([account2.account.address]), amount);
      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), 0n);
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), 0n);
    });

    it("works with 100% markup ratios", async () => {
      // 基金 50% + Burn 50% = 受取額と同額が上乗せされる（合計 = amount * 2）
      const { forToken, router } = await setupTokenAndRouter({ fund: 5000n, burn: 5000n });

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);

      const amount = parseEther("100");
      const { fundAmount, burnAmount, totalAmount } = expectedDistribution(amount, 5000n, 5000n);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      assert.equal(totalAmount, parseEther("200"));
      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), fundAmount);
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), burnAmount);
      // 受取人は満額（100）を受け取る
      assert.equal(await forToken.read.balanceOf([account2.account.address]), amount);
    });
  });

  describe("Distribution Validation", () => {
    it("sum of parts equals total paid", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      const { totalAmount } = expectedDistribution(amount);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      const fundAmount = await forToken.read.balanceOf([fundWallet.account.address]);
      const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
      const recipientAmount = await forToken.read.balanceOf([account2.account.address]);

      // 基金 + Burn + 受取 = from が支払った合計
      assert.equal(fundAmount + burnAmount + recipientAmount, totalAmount);
    });

    it("handles small amounts (rounding)", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, 1000n]);
      const amount = 10n;
      const { totalAmount } = expectedDistribution(amount);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      const fundAmount = await forToken.read.balanceOf([fundWallet.account.address]);
      const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
      const recipientAmount = await forToken.read.balanceOf([account2.account.address]);

      // 受取人は満額、基金・Burn は切り捨て。合計は totalAmount に一致する。
      assert.equal(recipientAmount, amount);
      assert.equal(fundAmount + burnAmount + recipientAmount, totalAmount);
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
      const { totalAmount } = expectedDistribution(amount);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

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

    it("fails when total exceeds allowance (markup not covered)", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      // 受取額ちょうどしか approve しない → 上乗せ分が足りず失敗する
      await forToken.write.approve([router.address as Address, amount], { account: account1.account });

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
          error.message.includes("ERC20InsufficientAllowance") || error.message.toLowerCase().includes("allowance"),
      );
    });

    it("fails when paused", async () => {
      const { forToken, router } = await setupTokenAndRouter();
      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      const { totalAmount } = expectedDistribution(amount);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

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
      const { fundAmount, burnAmount, totalAmount } = expectedDistribution(amount);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

      const initialBalance = await forToken.read.balanceOf([account1.account.address]);

      await router.write.transferWithDistribution([
        account1.account.address,
        account1.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      // 自己送金: 受取額は戻るので、実質の減少は上乗せ分（基金 + Burn）のみ
      const finalBalance = await forToken.read.balanceOf([account1.account.address]);
      assert.equal(finalBalance, initialBalance - fundAmount - burnAmount);
    });

    it("handles very large amounts", async () => {
      const { forToken, router } = await setupTokenAndRouter();
      const amount = parseEther("500000");
      const { fundAmount, burnAmount, totalAmount } = expectedDistribution(amount);
      // from は合計（上乗せ込み）を保有・approve する必要がある
      await forToken.write.transfer([account1.account.address, totalAmount]);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

      await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        DEFAULT_MESSAGE,
      ], { account: account1.account });

      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), fundAmount);
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), burnAmount);
      assert.equal(await forToken.read.balanceOf([account2.account.address]), amount);
    });

    it("works with empty message", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      const { fundAmount, burnAmount, totalAmount } = expectedDistribution(amount);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

      const hash = await router.write.transferWithDistribution([
        account1.account.address,
        account2.account.address,
        amount,
        "",
      ], { account: account1.account });
      await publicClient.waitForTransactionReceipt({ hash });

      assert.equal(await forToken.read.balanceOf([fundWallet.account.address]), fundAmount);
      assert.equal(await forToken.read.balanceOf([BURN_ADDRESS]), burnAmount);
      assert.equal(await forToken.read.balanceOf([account2.account.address]), amount);
    });

    it("emits TransferWithDistribution event", async () => {
      const { forToken, router } = await setupTokenAndRouter();

      await forToken.write.transfer([account1.account.address, parseEther("1000")]);
      const amount = parseEther("100");
      const { fundAmount, burnAmount, totalAmount } = expectedDistribution(amount);
      await forToken.write.approve([router.address as Address, totalAmount], { account: account1.account });

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

      assert.equal(getAddress(decoded.args.sender), getAddress(account1.account.address));
      assert.equal(getAddress(decoded.args.from), getAddress(account1.account.address));
      assert.equal(getAddress(decoded.args.recipient), getAddress(account2.account.address));
      // totalAmount = 上乗せ込みの合計、recipientAmount = 受取人が受け取る満額
      assert.equal(decoded.args.totalAmount, totalAmount);
      assert.equal(decoded.args.fundAmount, fundAmount);
      assert.equal(decoded.args.burnAmount, burnAmount);
      assert.equal(decoded.args.recipientAmount, amount);
      assert.equal(decoded.args.message, DEFAULT_MESSAGE);
    });
  });
});
