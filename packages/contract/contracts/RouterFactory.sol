// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {Router} from "./Router.sol";

contract RouterFactory {
    function deploy(
        bytes32 _salt,
        address _initialAdmin,
        address _fundWallet,
        uint256 _fundRatio,
        uint256 _burnRatio
    ) external returns (address addr) {
        bytes memory bytecode = abi.encodePacked(
            type(Router).creationCode,
            abi.encode(_initialAdmin, _fundWallet, _fundRatio, _burnRatio)
        );
        addr = Create2.deploy(0, _salt, bytecode);
    }

    function computeAddress(
        bytes32 _salt,
        address _initialAdmin,
        address _fundWallet,
        uint256 _fundRatio,
        uint256 _burnRatio
    ) external view returns (address addr) {
        bytes memory bytecode = abi.encodePacked(
            type(Router).creationCode,
            abi.encode(_initialAdmin, _fundWallet, _fundRatio, _burnRatio)
        );
        addr = Create2.computeAddress(_salt, keccak256(bytecode));
    }
}
