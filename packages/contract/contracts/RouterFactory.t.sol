// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RouterFactory} from "./RouterFactory.sol";
import {Router} from "./Router.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {Test} from "forge-std/Test.sol";

contract RouterFactoryTest is Test {
    RouterFactory factory;
    address fundWallet = address(0x5678);
    uint256 fundRatio = 1500; // 15%
    uint256 burnRatio = 500; // 5%

    function setUp() public {
        factory = new RouterFactory();
    }

    function test_ComputeAddressMatchesCreate2() public view {
        bytes32 salt = keccak256("compute-address");

        bytes memory bytecode = abi.encodePacked(
            type(Router).creationCode,
            abi.encode(fundWallet, fundRatio, burnRatio)
        );
        address expected = Create2.computeAddress(
            salt,
            keccak256(bytecode),
            address(factory)
        );

        address computed = factory.computeAddress(
            salt,
            fundWallet,
            fundRatio,
            burnRatio
        );

        require(computed == expected, "computed address should match Create2");
    }

    function test_DeployCreatesRouterAtComputedAddress() public {
        bytes32 salt = keccak256("deploy-router");

        address expected = factory.computeAddress(
            salt,
            fundWallet,
            fundRatio,
            burnRatio
        );

        address deployed = factory.deploy(
            salt,
            fundWallet,
            fundRatio,
            burnRatio
        );

        require(deployed == expected, "deploy should return computed address");

        Router router = Router(deployed);
        require(router.fundWallet() == fundWallet, "fundWallet should match");
        require(router.fundRatio() == fundRatio, "fundRatio should match");
        require(router.burnRatio() == burnRatio, "burnRatio should match");
    }
}
