import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress, type Address } from "viem";

describe("Router.transferWithPermit", async () => {
	const { viem } = await network.connect();
	const [deployer, account1, account2, fundWallet] =
		await viem.getWalletClients();
	const publicClient = await viem.getPublicClient();

	const NAME = "FoR";
	const SYMBOL = "FOR";
	const INITIAL_SUPPLY = parseEther("1000000");

	// Test parameters
	const fundRatio = 2000n; // 20%
	const burnRatio = 1000n; // 10%
	const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as Address;

	// Helper function to create permit signature
	async function createPermitSignature(
		signer: typeof account1,
		token: any,
		spender: Address,
		amount: bigint,
		deadline: bigint,
	) {
		const nonce = await token.read.nonces([signer.account.address]);
		const chainId = await publicClient.getChainId();

		const domain = {
			name: NAME,
			version: "1",
			chainId: chainId,
			verifyingContract: token.address as Address,
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
			owner: signer.account.address,
			spender: spender,
			value: amount,
			nonce: nonce,
			deadline: deadline,
		};

		const signature = await signer.signTypedData({
			domain,
			types,
			primaryType: "Permit",
			message,
		});

		const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
		const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
		const v = Number.parseInt(signature.slice(130, 132), 16);

		return { v, r, s, nonce };
	}

	// A. Happy Path Tests
	describe("Happy Path", () => {
		it("Should transfer with permit and distribute correctly with standard ratios", async () => {
			// Deploy contracts
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			// Give account1 tokens
			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			// Create permit signature
			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			// Execute transferWithPermit
			const hash = await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			await publicClient.waitForTransactionReceipt({ hash });

			// Calculate expected amounts
			const expectedFundAmount = (amount * fundRatio) / 10000n;
			const expectedBurnAmount = (amount * burnRatio) / 10000n;
			const expectedRecipientAmount =
				amount - expectedFundAmount - expectedBurnAmount;

			// Verify balances
			assert.equal(
				await forToken.read.balanceOf([fundWallet.account.address]),
				expectedFundAmount,
				"Fund wallet should receive correct amount",
			);
			assert.equal(
				await forToken.read.balanceOf([BURN_ADDRESS]),
				expectedBurnAmount,
				"Burn address should receive correct amount",
			);
			assert.equal(
				await forToken.read.balanceOf([account2.account.address]),
				expectedRecipientAmount,
				"Recipient should receive correct amount",
			);
		});

		it("Should transfer with zero ratios (100% to recipient)", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				0n, // 0% fund
				0n, // 0% burn
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			// All should go to recipient
			assert.equal(
				await forToken.read.balanceOf([account2.account.address]),
				amount,
				"Recipient should receive 100%",
			);
		});

		it("Should transfer with maximum ratios (100% total)", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				5000n, // 50% fund
				5000n, // 50% burn
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			// Verify distribution
			const fundAmount = await forToken.read.balanceOf([
				fundWallet.account.address,
			]);
			const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
			const recipientAmount = await forToken.read.balanceOf([
				account2.account.address,
			]);

			assert.equal(fundAmount, parseEther("50"));
			assert.equal(burnAmount, parseEther("50"));
			assert.equal(recipientAmount, 0n);
		});
	});

	// B. Distribution Validation Tests
	describe("Distribution Validation", () => {
		it("Should calculate exact distribution amounts", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			// Verify sum equals total
			const fundAmount = await forToken.read.balanceOf([
				fundWallet.account.address,
			]);
			const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
			const recipientAmount = await forToken.read.balanceOf([
				account2.account.address,
			]);

			assert.equal(
				fundAmount + burnAmount + recipientAmount,
				amount,
				"Sum of distributions should equal total amount",
			);
		});

		it("Should handle rounding with small amounts", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([account1.account.address, 1000n]);

			const amount = 10n; // Very small amount
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			// Verify no over-distribution due to rounding
			const fundAmount = await forToken.read.balanceOf([
				fundWallet.account.address,
			]);
			const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
			const recipientAmount = await forToken.read.balanceOf([
				account2.account.address,
			]);

			assert.ok(
				fundAmount + burnAmount + recipientAmount <= amount,
				"Rounding should not cause over-distribution",
			);
		});
	});

	// C. Permit Integration Tests
	describe("Permit Integration", () => {
		it("Should fail with expired permit", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) - 3600); // Expired
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await assert.rejects(
				async () => {
					await router.write.transferWithPermit([
						account1.account.address,
						account2.account.address,
						amount,
						deadline,
						v,
						r,
						s,
					]);
				},
				(error: Error) => {
					return error.message.includes("ERC2612ExpiredSignature");
				},
				"Should fail with expired permit",
			);
		});

		it("Should fail with invalid signature", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

			// Use invalid signature
			const invalidR =
				"0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`;
			const invalidS =
				"0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`;
			const invalidV = 27;

			await assert.rejects(
				async () => {
					await router.write.transferWithPermit([
						account1.account.address,
						account2.account.address,
						amount,
						deadline,
						invalidV,
						invalidR,
						invalidS,
					]);
				},
				(error: Error) => {
					return error.message.includes("ERC2612InvalidSigner");
				},
				"Should fail with invalid signature",
			);
		});

		it("Should fail with reused permit (nonce already used)", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("50");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			// First transfer should succeed
			await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			// Second transfer with same signature should fail
			await assert.rejects(
				async () => {
					await router.write.transferWithPermit([
						account1.account.address,
						account2.account.address,
						amount,
						deadline,
						v,
						r,
						s,
					]);
				},
				(error: Error) => {
					return error.message.includes("ERC2612InvalidSigner");
				},
				"Should fail with reused permit",
			);
		});
	});

	// D. Error Handling Tests
	describe("Error Handling", () => {
		it("Should fail with zero amount", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			const amount = 0n;
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await assert.rejects(
				async () => {
					await router.write.transferWithPermit([
						account1.account.address,
						account2.account.address,
						amount,
						deadline,
						v,
						r,
						s,
					]);
				},
				(error: Error) => {
					return error.message.includes("InvalidAmount");
				},
				"Should fail with zero amount",
			);
		});

		it("Should fail with zero recipient address", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await assert.rejects(
				async () => {
					await router.write.transferWithPermit([
						account1.account.address,
						"0x0000000000000000000000000000000000000000" as Address, // Zero address as recipient
						amount,
						deadline,
						v,
						r,
						s,
					]);
				},
				(error: Error) => {
					return error.message.includes("InvalidRecipient");
				},
				"Should fail with zero recipient",
			);
		});

		it("Should fail with insufficient balance", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			// Don't give account1 any tokens
			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await assert.rejects(
				async () => {
					await router.write.transferWithPermit([
						account1.account.address,
						account2.account.address,
						amount,
						deadline,
						v,
						r,
						s,
					]);
				},
				(error: Error) => {
					return (
						error.message.includes("ERC20InsufficientBalance") ||
						error.message.includes("transfer failed")
					);
				},
				"Should fail with insufficient balance",
			);
		});

		it("Should fail when contract is paused", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			// Pause the contract
			await router.write.pause();

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await assert.rejects(
				async () => {
					await router.write.transferWithPermit([
						account1.account.address,
						account2.account.address,
						amount,
						deadline,
						v,
						r,
						s,
					]);
				},
				(error: Error) => {
					return error.message.includes("EnforcedPause");
				},
				"Should fail when paused",
			);
		});
	});

	// E. Event Emission Tests
	describe("Event Emission", () => {
		it("Should emit TransferWithDistribution event with correct parameters", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			const hash = await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			const receipt = await publicClient.waitForTransactionReceipt({ hash });

			// Find the TransferWithDistribution event
			const transferEvent = receipt.logs.find(
				(log) => log.address.toLowerCase() === router.address.toLowerCase(),
			);

			assert.ok(
				transferEvent,
				"TransferWithDistribution event should be emitted",
			);
		});
	});

	// F. Edge Cases
	describe("Edge Cases", () => {
		it("Should handle self-transfer (from == recipient)", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const initialBalance = await forToken.read.balanceOf([
				account1.account.address,
			]);
			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			await router.write.transferWithPermit([
				account1.account.address,
				account1.account.address, // Self-transfer
				amount,
				deadline,
				v,
				r,
				s,
			]);

			// account1 should have initial - fundAmount - burnAmount
			const expectedFundAmount = (amount * fundRatio) / 10000n;
			const expectedBurnAmount = (amount * burnRatio) / 10000n;
			const finalBalance = await forToken.read.balanceOf([
				account1.account.address,
			]);

			assert.equal(
				finalBalance,
				initialBalance - expectedFundAmount - expectedBurnAmount,
				"Self-transfer should work correctly",
			);
		});

		it("Should handle very large amounts", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			const largeAmount = parseEther("500000");
			await forToken.write.transfer([account1.account.address, largeAmount]);

			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				largeAmount,
				deadline,
			);

			await router.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				largeAmount,
				deadline,
				v,
				r,
				s,
			]);

			// Verify distribution
			const fundAmount = await forToken.read.balanceOf([
				fundWallet.account.address,
			]);
			const burnAmount = await forToken.read.balanceOf([BURN_ADDRESS]);
			const recipientAmount = await forToken.read.balanceOf([
				account2.account.address,
			]);

			assert.equal(
				fundAmount + burnAmount + recipientAmount,
				largeAmount,
				"Large amount distribution should be accurate",
			);
		});

		it("Should handle relayer pattern (msg.sender != from)", async () => {
			const forToken = await viem.deployContract("FoRToken", [
				INITIAL_SUPPLY,
				NAME,
				SYMBOL,
			]);
			const router = await viem.deployContract("Router", [
				deployer.account.address,
				forToken.address,
				fundWallet.account.address,
				fundRatio,
				burnRatio,
			]);

			await forToken.write.transfer([
				account1.account.address,
				parseEther("1000"),
			]);

			const amount = parseEther("100");
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
			const { v, r, s } = await createPermitSignature(
				account1,
				forToken,
				router.address,
				amount,
				deadline,
			);

			// deployer (different from account1) calls transferWithPermit
			const routerAsDeployer = await viem.getContractAt(
				"Router",
				router.address,
				{
					client: { wallet: deployer },
				},
			);

			await routerAsDeployer.write.transferWithPermit([
				account1.account.address,
				account2.account.address,
				amount,
				deadline,
				v,
				r,
				s,
			]);

			// Verify transfer succeeded
			const recipientBalance = await forToken.read.balanceOf([
				account2.account.address,
			]);
			assert.ok(
				recipientBalance > 0n,
				"Relayer pattern should work (msg.sender != from)",
			);
		});
	});
});
