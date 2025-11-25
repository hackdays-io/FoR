import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RouterFactoryModule", (m) => {
	const routerFactory = m.contract("RouterFactory");
	return { routerFactory };
});
