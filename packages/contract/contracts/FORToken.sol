// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FORToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("FoR Token", "FOR") {
        _mint(msg.sender, initialSupply);
    }
}
