import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FoRToken from "./FoRToken.js";
import RouterFactory from "./RouterFactory.js";

export default buildModule("RouterModule", (m) => {
  const { forToken } = m.useModule(FoRToken);
  const { routerFactory } = m.useModule(RouterFactory);

  m.call(routerFactory, "deploy", [
    m.getParameter("salt"),
    m.getParameter("initialAdmin"),
    forToken,
    m.getParameter("fundWallet"),
    m.getParameter("fundRatio"),
    m.getParameter("burnRatio"),
  ]);

  return { routerFactory };
});
