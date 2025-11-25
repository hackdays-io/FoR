import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import RouterFactory from "./RouterFactory.js";

export default buildModule("RouterModule", (m) => {
	const { routerFactory } = m.useModule(RouterFactory);

	m.call(routerFactory, "deploy", [
		m.getParameter("salt"),
		m.getParameter("fundWallet"),
		m.getParameter("fundRatio"),
		m.getParameter("burnRatio"),
	]);

	return { routerFactory };
});
