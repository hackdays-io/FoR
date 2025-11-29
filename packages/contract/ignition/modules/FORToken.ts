import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

export default buildModule("FORTokenModule", (m) => {
    // Initial supply: 1,000,000 FOR tokens
    const initialSupply = m.getParameter("initialSupply", parseEther("1000000"));

    const forToken = m.contract("FORToken", [initialSupply]);

    return { forToken };
});
