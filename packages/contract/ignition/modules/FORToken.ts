import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FoRTokenModule", (m) => {
  const forToken = m.contract("FoRToken", [
    m.getParameter("initialSupply"),
    m.getParameter("name"),
    m.getParameter("symbol"),
  ]);

  return { forToken };
});
