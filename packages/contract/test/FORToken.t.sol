// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {FORToken} from "../contracts/FORToken.sol";

/**
 * @title FORToken Solidity Unit Tests
 * @notice Unit tests for FORToken contract following Hardhat v3 best practices
 * @dev These tests focus on:
 *      - Core ERC20 functionality
 *      - Invariants and edge cases
 *      - Fast execution for continuous testing
 */
contract FORTokenTest is Test {
    FORToken public forToken;
    
    address public deployer = address(this);
    address public account1 = address(0x1);
    address public account2 = address(0x2);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether; // 1,000,000 FOR
    
    /**
     * @notice Setup function called before each test
     * @dev Deploys a fresh FORToken contract for each test
     */
    function setUp() public {
        forToken = new FORToken(INITIAL_SUPPLY);
    }
    
    // ============================================
    // Deployment & Initial State Tests
    // ============================================
    
    function testName() public {
        assertEq(forToken.name(), "FoR Token", "Token name should be 'FoR Token'");
    }
    
    function testSymbol() public {
        assertEq(forToken.symbol(), "FOR", "Token symbol should be 'FOR'");
    }
    
    function testDecimals() public {
        assertEq(forToken.decimals(), 18, "Token should have 18 decimals");
    }
    
    function testInitialSupply() public {
        assertEq(forToken.totalSupply(), INITIAL_SUPPLY, "Total supply should match initial supply");
    }
    
    function testDeployerBalance() public {
        assertEq(
            forToken.balanceOf(deployer),
            INITIAL_SUPPLY,
            "Deployer should receive all initial supply"
        );
    }
    
    function testOtherAccountsStartWithZero() public {
        assertEq(forToken.balanceOf(account1), 0, "New accounts should start with zero balance");
        assertEq(forToken.balanceOf(account2), 0, "New accounts should start with zero balance");
    }
    
    // ============================================
    // Transfer Tests
    // ============================================
    
    function testTransfer() public {
        uint256 transferAmount = 100 ether;
        
        forToken.transfer(account1, transferAmount);
        
        assertEq(forToken.balanceOf(account1), transferAmount, "Recipient should receive tokens");
        assertEq(
            forToken.balanceOf(deployer),
            INITIAL_SUPPLY - transferAmount,
            "Sender balance should decrease"
        );
    }
    
    function testTransferToZeroAddress() public {
        vm.expectRevert();
        forToken.transfer(address(0), 100 ether);
    }
    
    function testTransferInsufficientBalance() public {
        uint256 tooMuch = INITIAL_SUPPLY + 1;
        
        vm.expectRevert();
        forToken.transfer(account1, tooMuch);
    }
    
    function testTransferFromZeroBalance() public {
        vm.prank(account1);
        vm.expectRevert();
        forToken.transfer(account2, 1 ether);
    }
    
    function testTransferZeroAmount() public {
        forToken.transfer(account1, 0);
        assertEq(forToken.balanceOf(account1), 0, "Zero transfer should succeed but not change balance");
    }
    
    // ============================================
    // Approve & Allowance Tests
    // ============================================
    
    function testApprove() public {
        uint256 approveAmount = 500 ether;
        
        forToken.approve(account1, approveAmount);
        
        assertEq(
            forToken.allowance(deployer, account1),
            approveAmount,
            "Allowance should be set correctly"
        );
    }
    
    function testApproveToZeroAddress() public {
        vm.expectRevert();
        forToken.approve(address(0), 100 ether);
    }
    
    function testApproveOverwrite() public {
        forToken.approve(account1, 500 ether);
        forToken.approve(account1, 1000 ether);
        
        assertEq(
            forToken.allowance(deployer, account1),
            1000 ether,
            "Second approval should overwrite first"
        );
    }
    
    // ============================================
    // TransferFrom Tests
    // ============================================
    
    function testTransferFrom() public {
        uint256 approveAmount = 500 ether;
        uint256 transferAmount = 200 ether;
        
        // Deployer approves account1 to spend tokens
        forToken.approve(account1, approveAmount);
        
        // Account1 transfers from deployer to account2
        vm.prank(account1);
        forToken.transferFrom(deployer, account2, transferAmount);
        
        assertEq(forToken.balanceOf(account2), transferAmount, "Recipient should receive tokens");
        assertEq(
            forToken.balanceOf(deployer),
            INITIAL_SUPPLY - transferAmount,
            "Sender balance should decrease"
        );
        assertEq(
            forToken.allowance(deployer, account1),
            approveAmount - transferAmount,
            "Allowance should decrease"
        );
    }
    
    function testTransferFromInsufficientAllowance() public {
        uint256 approveAmount = 100 ether;
        uint256 transferAmount = 200 ether;
        
        forToken.approve(account1, approveAmount);
        
        vm.prank(account1);
        vm.expectRevert();
        forToken.transferFrom(deployer, account2, transferAmount);
    }
    
    function testTransferFromZeroAllowance() public {
        vm.prank(account1);
        vm.expectRevert();
        forToken.transferFrom(deployer, account2, 100 ether);
    }
    
    function testTransferFromInsufficientBalance() public {
        // Account1 has zero tokens but gets approval
        vm.prank(account1);
        forToken.approve(account2, 100 ether);
        
        // Account2 tries to transfer more than account1's balance
        vm.prank(account2);
        vm.expectRevert();
        forToken.transferFrom(account1, deployer, 1 ether);
    }
    
    // ============================================
    // Fuzz Tests
    // ============================================
    
    /**
     * @notice Fuzz test for transfer with random amounts
     * @param amount Random transfer amount
     */
    function testFuzzTransfer(uint256 amount) public {
        // Bound amount to valid range (0 to INITIAL_SUPPLY)
        amount = bound(amount, 0, INITIAL_SUPPLY);
        
        forToken.transfer(account1, amount);
        
        assertEq(forToken.balanceOf(account1), amount, "Recipient should receive exact amount");
        assertEq(
            forToken.balanceOf(deployer),
            INITIAL_SUPPLY - amount,
            "Sender balance should decrease by exact amount"
        );
    }
    
    /**
     * @notice Fuzz test for approve with random amounts
     * @param amount Random approval amount
     */
    function testFuzzApprove(uint256 amount) public {
        forToken.approve(account1, amount);
        
        assertEq(
            forToken.allowance(deployer, account1),
            amount,
            "Allowance should match approved amount"
        );
    }
    
    /**
     * @notice Fuzz test for transferFrom with random amounts
     * @param approveAmount Random approval amount
     * @param transferAmount Random transfer amount
     */
    function testFuzzTransferFrom(uint256 approveAmount, uint256 transferAmount) public {
        // Bound amounts to valid ranges
        approveAmount = bound(approveAmount, 0, type(uint256).max);
        transferAmount = bound(transferAmount, 0, approveAmount);
        
        // Also need to ensure deployer has enough balance
        if (transferAmount > INITIAL_SUPPLY) {
            transferAmount = INITIAL_SUPPLY;
        }
        
        forToken.approve(account1, approveAmount);
        
        vm.prank(account1);
        forToken.transferFrom(deployer, account2, transferAmount);
        
        assertEq(forToken.balanceOf(account2), transferAmount, "Recipient should receive tokens");
        assertEq(
            forToken.balanceOf(deployer),
            INITIAL_SUPPLY - transferAmount,
            "Sender balance should decrease"
        );
    }
    
    // ============================================
    // Invariant Tests
    // ============================================
    
    /**
     * @notice Invariant: Total supply should never change after deployment
     */
    function testInvariantTotalSupply() public {
        // Perform various operations
        forToken.transfer(account1, 1000 ether);
        
        vm.prank(account1);
        forToken.transfer(account2, 500 ether);
        
        forToken.approve(account1, 500 ether);
        vm.prank(account1);
        forToken.transferFrom(deployer, account2, 300 ether);
        
        // Total supply should remain constant
        assertEq(
            forToken.totalSupply(),
            INITIAL_SUPPLY,
            "Total supply should never change"
        );
    }
    
    /**
     * @notice Invariant: Sum of all balances should equal total supply
     */
    function testInvariantBalanceSum() public {
        forToken.transfer(account1, 400_000 ether);
        forToken.transfer(account2, 300_000 ether);
        
        uint256 sumOfBalances = forToken.balanceOf(deployer) +
                                forToken.balanceOf(account1) +
                                forToken.balanceOf(account2);
        
        assertEq(
            sumOfBalances,
            forToken.totalSupply(),
            "Sum of balances should equal total supply"
        );
    }
    
    /**
     * @notice Invariant: No balance should exceed total supply
     */
    function testInvariantMaxBalance() public {
        assertTrue(
            forToken.balanceOf(deployer) <= forToken.totalSupply(),
            "No single balance should exceed total supply"
        );
        
        forToken.transfer(account1, 100 ether);
        assertTrue(
            forToken.balanceOf(account1) <= forToken.totalSupply(),
            "No single balance should exceed total supply"
        );
    }
}
