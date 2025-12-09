// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Router} from "./Router.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract RouterTest {
    Router router;
    address fundWallet = address(0x1234);
    uint256 fundRatio = 2000; // 20%
    uint256 burnRatio = 1000; // 10%
    address owner = address(this);
    address user1 = address(0x5678);
    address user2 = address(0x9ABC);

    function setUp() public {
        router = new Router(fundWallet, fundRatio, burnRatio);
    }

    function test_InitialFundWallet() public view {
        require(
            router.fundWallet() == fundWallet,
            "fundWallet should be set correctly"
        );
    }

    function test_InitialFundRatio() public view {
        require(
            router.fundRatio() == fundRatio,
            "fundRatio should be set correctly"
        );
    }

    function test_InitialBurnRatio() public view {
        require(
            router.burnRatio() == burnRatio,
            "burnRatio should be set correctly"
        );
    }

    function test_BurnAddressIsZero() public view {
        require(
            router.BURN_ADDRESS() == address(0),
            "BURN_ADDRESS should be address(0)"
        );
    }

    // AccessControl tests

    function test_InitialRoles() public view {
        bytes32 fundManagerRole = router.FUND_MANAGER_ROLE();
        bytes32 ratioManagerRole = router.RATIO_MANAGER_ROLE();
        bytes32 defaultAdminRole = router.DEFAULT_ADMIN_ROLE();

        require(
            router.hasRole(defaultAdminRole, owner),
            "Owner should have DEFAULT_ADMIN_ROLE"
        );
        require(
            router.hasRole(fundManagerRole, owner),
            "Owner should have FUND_MANAGER_ROLE"
        );
        require(
            router.hasRole(ratioManagerRole, owner),
            "Owner should have RATIO_MANAGER_ROLE"
        );
    }

    function test_SetFundRatioWithRole() public {
        uint256 newFundRatio = 3000; // 30%
        router.setFundRatio(newFundRatio);
        require(
            router.fundRatio() == newFundRatio,
            "fundRatio should be updated"
        );
    }

    function test_SetBurnRatioWithRole() public {
        uint256 newBurnRatio = 1500; // 15%
        router.setBurnRatio(newBurnRatio);
        require(
            router.burnRatio() == newBurnRatio,
            "burnRatio should be updated"
        );
    }

    function test_SetFundWalletWithRole() public {
        address newFundWallet = address(0xABCD);
        router.setFundWallet(newFundWallet);
        require(
            router.fundWallet() == newFundWallet,
            "fundWallet should be updated"
        );
    }

    function test_FailSetFundRatioExceedsLimit() public {
        uint256 invalidFundRatio = 9500; // 95%, total would be 105%
        try router.setFundRatio(invalidFundRatio) {
            revert("Should have failed");
        } catch Error(string memory reason) {
            require(
                keccak256(bytes(reason)) ==
                    keccak256(bytes("Total ratio exceeds 100%")),
                "Should fail with correct error message"
            );
        }
    }

    function test_FailSetBurnRatioExceedsLimit() public {
        uint256 invalidBurnRatio = 8500; // 85%, total would be 105%
        try router.setBurnRatio(invalidBurnRatio) {
            revert("Should have failed");
        } catch Error(string memory reason) {
            require(
                keccak256(bytes(reason)) ==
                    keccak256(bytes("Total ratio exceeds 100%")),
                "Should fail with correct error message"
            );
        }
    }

    function test_FailSetFundWalletZeroAddress() public {
        try router.setFundWallet(address(0)) {
            revert("Should have failed");
        } catch Error(string memory reason) {
            require(
                keccak256(bytes(reason)) ==
                    keccak256(bytes("Invalid fund wallet address")),
                "Should fail with correct error message"
            );
        }
    }

    function test_GrantRatioManagerRole() public {
        bytes32 ratioManagerRole = router.RATIO_MANAGER_ROLE();
        router.grantRole(ratioManagerRole, user1);
        require(
            router.hasRole(ratioManagerRole, user1),
            "user1 should have RATIO_MANAGER_ROLE"
        );
    }

    function test_RevokeRatioManagerRole() public {
        bytes32 ratioManagerRole = router.RATIO_MANAGER_ROLE();
        router.grantRole(ratioManagerRole, user1);
        router.revokeRole(ratioManagerRole, user1);
        require(
            !router.hasRole(ratioManagerRole, user1),
            "user1 should not have RATIO_MANAGER_ROLE"
        );
    }
}
