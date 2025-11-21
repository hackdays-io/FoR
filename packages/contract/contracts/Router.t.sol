// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Router } from "./Router.sol";

contract RouterTest {
    Router router;
    address fundWallet = address(0x1234);
    uint256 fundRatio = 2000; // 20%
    uint256 burnRatio = 1000; // 10%

    function setUp() public {
        router = new Router(fundWallet, fundRatio, burnRatio);
    }

    function test_InitialFundWallet() public view {
        require(router.fundWallet() == fundWallet, "fundWallet should be set correctly");
    }

    function test_InitialFundRatio() public view {
        require(router.fundRatio() == fundRatio, "fundRatio should be set correctly");
    }

    function test_InitialBurnRatio() public view {
        require(router.burnRatio() == burnRatio, "burnRatio should be set correctly");
    }

    function test_BurnAddressIsZero() public view {
        require(router.BURN_ADDRESS() == address(0), "BURN_ADDRESS should be address(0)");
    }
}

