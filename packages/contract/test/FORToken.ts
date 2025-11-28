import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

describe("FORToken", async function () {
    const { viem } = await network.connect();
    const [deployer, account1, account2] = await viem.getWalletClients();

    const INITIAL_SUPPLY = parseEther("1000000"); // 1,000,000 FOR
    const NAME = "FoR";
    const SYMBOL = "FOR";

    it("Should deploy with correct name, symbol, and decimals", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);
        const name = await forToken.read.name();
        const symbol = await forToken.read.symbol();
        const decimals = await forToken.read.decimals();

        assert.equal(name, "FoR");
        assert.equal(symbol, "FOR");
        assert.equal(decimals, 18);
    });

    it("Should mint initial supply to deployer", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);

        const deployerBalance = await forToken.read.balanceOf([deployer.account.address]);
        const totalSupply = await forToken.read.totalSupply();

        assert.equal(deployerBalance, INITIAL_SUPPLY);
        assert.equal(totalSupply, INITIAL_SUPPLY);
    });

    it("Should transfer tokens correctly", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);
        const transferAmount = parseEther("100");

        await forToken.write.transfer([account1.account.address, transferAmount]);

        const account1Balance = await forToken.read.balanceOf([account1.account.address]);
        const deployerBalance = await forToken.read.balanceOf([deployer.account.address]);

        assert.equal(account1Balance, transferAmount);
        assert.equal(deployerBalance, INITIAL_SUPPLY - transferAmount);
    });

    it("Should emit Transfer event on transfer", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);
        const transferAmount = parseEther("100");
        const publicClient = await viem.getPublicClient();

        const hash = await forToken.write.transfer([account1.account.address, transferAmount]);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const transferEvent = receipt.logs.find(
            (log) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        );

        assert.ok(transferEvent, "Transfer event should be emitted");
    });

    it("Should approve and transferFrom correctly", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);
        const approveAmount = parseEther("500");
        const transferAmount = parseEther("200");

        // Approve account1 to spend deployer's tokens
        await forToken.write.approve([account1.account.address, approveAmount]);

        const allowance = await forToken.read.allowance([
            deployer.account.address,
            account1.account.address,
        ]);
        assert.equal(allowance, approveAmount);

        // Account1 transfers from deployer to account2
        const forTokenAsAccount1 = await viem.getContractAt(
            "FORToken",
            forToken.address,
            { client: { wallet: account1 } },
        );

        await forTokenAsAccount1.write.transferFrom([
            deployer.account.address,
            account2.account.address,
            transferAmount,
        ]);

        const account2Balance = await forToken.read.balanceOf([account2.account.address]);
        const newAllowance = await forToken.read.allowance([
            deployer.account.address,
            account1.account.address,
        ]);

        assert.equal(account2Balance, transferAmount);
        assert.equal(newAllowance, approveAmount - transferAmount);
    });

    it("Should emit Approval event on approve", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);
        const approveAmount = parseEther("1000");
        const publicClient = await viem.getPublicClient();

        const hash = await forToken.write.approve([account1.account.address, approveAmount]);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const approvalEvent = receipt.logs.find(
            (log) => log.topics[0] === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"
        );

        assert.ok(approvalEvent, "Approval event should be emitted");
    });

    it("Should fail when transferring more than balance", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);
        const tooMuch = INITIAL_SUPPLY + 1n;

        await assert.rejects(
            async () => {
                await forToken.write.transfer([account1.account.address, tooMuch]);
            },
            (error: Error) => {
                return error.message.includes("ERC20InsufficientBalance");
            },
        );
    });

    it("Should fail when transferFrom exceeds allowance", async function () {
        const forToken = await viem.deployContract("FORToken", [INITIAL_SUPPLY, NAME, SYMBOL]);
        const approveAmount = parseEther("100");
        const transferAmount = parseEther("200");

        await forToken.write.approve([account1.account.address, approveAmount]);

        const forTokenAsAccount1 = await viem.getContractAt(
            "FORToken",
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
});
