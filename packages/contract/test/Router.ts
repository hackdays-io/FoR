import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress } from "viem";

describe("Router", async () => {
	const { viem } = await network.connect();
	const [owner, user1] = await viem.getWalletClients();

	const fundWallet =
		"0x1234567890123456789012345678901234567890" as `0x${string}`;
	const fundRatio = 2000n; // 20%
	const burnRatio = 1000n; // 10%

	it("Should deploy with correct initial values", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		assert.equal(await router.read.fundWallet(), fundWallet);
		assert.equal(await router.read.fundRatio(), fundRatio);
		assert.equal(await router.read.burnRatio(), burnRatio);
		assert.equal(
			await router.read.BURN_ADDRESS(),
			"0x000000000000000000000000000000000000dEaD",
		);
	});

	it("Should set up initial roles correctly", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const FUND_MANAGER_ROLE = await router.read.FUND_MANAGER_ROLE();
		const RATIO_MANAGER_ROLE = await router.read.RATIO_MANAGER_ROLE();
		const DEFAULT_ADMIN_ROLE = await router.read.DEFAULT_ADMIN_ROLE();

		assert.equal(
			await router.read.hasRole([DEFAULT_ADMIN_ROLE, owner.account.address]),
			true,
			"Owner should have DEFAULT_ADMIN_ROLE",
		);
		assert.equal(
			await router.read.hasRole([FUND_MANAGER_ROLE, owner.account.address]),
			true,
			"Owner should have FUND_MANAGER_ROLE",
		);
		assert.equal(
			await router.read.hasRole([RATIO_MANAGER_ROLE, owner.account.address]),
			true,
			"Owner should have RATIO_MANAGER_ROLE",
		);
	});

	it("Should allow RATIO_MANAGER_ROLE to set fund ratio", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const newFundRatio = 3000n; // 30%
		await router.write.setFundRatio([newFundRatio]);

		assert.equal(await router.read.fundRatio(), newFundRatio);
	});

	it("Should allow RATIO_MANAGER_ROLE to set burn ratio", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const newBurnRatio = 1500n; // 15%
		await router.write.setBurnRatio([newBurnRatio]);

		assert.equal(await router.read.burnRatio(), newBurnRatio);
	});

	it("Should allow FUND_MANAGER_ROLE to set fund wallet", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const newFundWallet = getAddress(
			"0xabcdef0123456789012345678901234567890123",
		);
		await router.write.setFundWallet([newFundWallet]);

		assert.equal(
			(await router.read.fundWallet()).toLowerCase(),
			newFundWallet.toLowerCase(),
		);
	});

	it("Should reject fund ratio that exceeds 100% total", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const invalidFundRatio = 9500n; // 95%, total would be 105%

		await assert.rejects(
			async () => {
				await router.write.setFundRatio([invalidFundRatio]);
			},
			(error: Error) => {
				return error.message.includes("Total ratio exceeds 100%");
			},
		);
	});

	it("Should reject burn ratio that exceeds 100% total", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const invalidBurnRatio = 8500n; // 85%, total would be 105%

		await assert.rejects(
			async () => {
				await router.write.setBurnRatio([invalidBurnRatio]);
			},
			(error: Error) => {
				return error.message.includes("Total ratio exceeds 100%");
			},
		);
	});

	it("Should reject zero address for fund wallet", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const zeroAddress =
			"0x0000000000000000000000000000000000000000" as `0x${string}`;

		await assert.rejects(
			async () => {
				await router.write.setFundWallet([zeroAddress]);
			},
			(error: Error) => {
				return error.message.includes("Invalid fund wallet address");
			},
		);
	});

	it("Should allow granting RATIO_MANAGER_ROLE", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const RATIO_MANAGER_ROLE = await router.read.RATIO_MANAGER_ROLE();

		await router.write.grantRole([RATIO_MANAGER_ROLE, user1.account.address]);

		assert.equal(
			await router.read.hasRole([RATIO_MANAGER_ROLE, user1.account.address]),
			true,
			"user1 should have RATIO_MANAGER_ROLE",
		);
	});

	it("Should allow revoking RATIO_MANAGER_ROLE", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const RATIO_MANAGER_ROLE = await router.read.RATIO_MANAGER_ROLE();

		await router.write.grantRole([RATIO_MANAGER_ROLE, user1.account.address]);
		await router.write.revokeRole([RATIO_MANAGER_ROLE, user1.account.address]);

		assert.equal(
			await router.read.hasRole([RATIO_MANAGER_ROLE, user1.account.address]),
			false,
			"user1 should not have RATIO_MANAGER_ROLE",
		);
	});

	it("Should reject unauthorized access to setFundRatio", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const routerAsUser1 = await viem.getContractAt("Router", router.address, {
			client: { wallet: user1 },
		});

		await assert.rejects(
			async () => {
				await routerAsUser1.write.setFundRatio([3000n]);
			},
			(error: Error) => {
				return error.message.includes("AccessControl");
			},
		);
	});

	it("Should reject unauthorized access to setBurnRatio", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const routerAsUser1 = await viem.getContractAt("Router", router.address, {
			client: { wallet: user1 },
		});

		await assert.rejects(
			async () => {
				await routerAsUser1.write.setBurnRatio([1500n]);
			},
			(error: Error) => {
				return error.message.includes("AccessControl");
			},
		);
	});

	it("Should reject unauthorized access to setFundWallet", async () => {
		const forToken =
			"0x0000000000000000000000000000000000001234" as `0x${string}`; // Dummy FORToken address
		const router = await viem.deployContract("Router", [
			owner.account.address,
			forToken,
			fundWallet,
			fundRatio,
			burnRatio,
		]);

		const routerAsUser1 = await viem.getContractAt("Router", router.address, {
			client: { wallet: user1 },
		});

		const newFundWallet = getAddress(
			"0xabcdef0123456789012345678901234567890123",
		);

		await assert.rejects(
			async () => {
				await routerAsUser1.write.setFundWallet([newFundWallet]);
			},
			(error: Error) => {
				return error.message.includes("AccessControl");
			},
		);
	});
});
