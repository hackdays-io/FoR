// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {FoRToken} from "./FORToken.sol";

contract FoRTokenTest is Test {
    FoRToken token;

    address deployer = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);

    uint256 constant INITIAL_SUPPLY = 1_000_000 ether;
    string constant NAME = "FoR Token";
    string constant SYMBOL = "FOR";

    function setUp() public {
        token = new FoRToken(INITIAL_SUPPLY, NAME, SYMBOL);
    }

    function test_InitialMetadata() public view {
        require(
            keccak256(bytes(token.name())) == keccak256(bytes(NAME)),
            "name"
        );
        require(
            keccak256(bytes(token.symbol())) == keccak256(bytes(SYMBOL)),
            "symbol"
        );
        require(token.decimals() == 18, "decimals");
    }

    function test_InitialSupplyAndBalance() public view {
        require(token.totalSupply() == INITIAL_SUPPLY, "total supply");
        require(
            token.balanceOf(deployer) == INITIAL_SUPPLY,
            "deployer balance"
        );
    }

    function test_TransferUpdatesBalances() public {
        uint256 amount = 100 ether;

        token.transfer(user1, amount);

        require(token.balanceOf(user1) == amount, "recipient balance");
        require(
            token.balanceOf(deployer) == INITIAL_SUPPLY - amount,
            "sender balance"
        );
    }

    function test_TransferToZeroAddressReverts() public {
        vm.expectRevert();
        token.transfer(address(0), 1 ether);
    }

    function test_TransferInsufficientBalanceReverts() public {
        vm.prank(user1);
        vm.expectRevert();
        token.transfer(user2, 1 ether);
    }

    function test_ApproveAndAllowance() public {
        uint256 amount = 500 ether;

        token.approve(user1, amount);

        require(token.allowance(deployer, user1) == amount, "allowance");
    }

    function test_TransferFromSpendsAllowance() public {
        uint256 approveAmount = 200 ether;

        token.approve(user1, approveAmount);

        vm.prank(user1);
        token.transferFrom(deployer, user2, 100 ether);

        require(token.balanceOf(user2) == 100 ether, "recipient balance");
        require(
            token.allowance(deployer, user1) == approveAmount - 100 ether,
            "allowance reduced"
        );
    }

    function test_TransferFromOverAllowanceReverts() public {
        token.approve(user1, 50 ether);

        vm.prank(user1);
        vm.expectRevert();
        token.transferFrom(deployer, user2, 60 ether);
    }

    function testFuzz_Transfer(uint256 amount) public {
        amount = bound(amount, 0, INITIAL_SUPPLY);

        token.transfer(user1, amount);

        require(token.balanceOf(user1) == amount, "recipient balance");
        require(
            token.balanceOf(deployer) == INITIAL_SUPPLY - amount,
            "sender balance"
        );
    }
}
