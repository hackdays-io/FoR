// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {FoRToken} from "./FORToken.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract FoRTokenTest is Test {
    // ============ Constants ============
    uint256 constant INITIAL_SUPPLY = 1_000_000 ether;
    string constant NAME = "FoR Token";
    string constant SYMBOL = "FOR";

    uint256 constant ADMIN_PRIVATE_KEY = 0xA11CE;
    bytes32 constant DEFAULT_ADMIN_ROLE = 0x00;

    // ============ State Variables ============
    FoRToken token;

    // Test addresses
    address deployer = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    address adminSigner;

    // Computed in setUp
    bytes32 adminRole;

    function setUp() public {
        token = new FoRToken(INITIAL_SUPPLY, NAME, SYMBOL);
        adminSigner = vm.addr(ADMIN_PRIVATE_KEY);
        adminRole = token.ADMIN_ROLE();
        
        // Add user1 and user2 to allow list for basic transfer tests
        token.addToAllowList(user1);
        token.addToAllowList(user2);
    }

    // ============ Basic ERC20 Tests ============

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

    // ============ Initial State Tests ============

    function test_DeployerHasDefaultAdminRole() public view {
        require(token.hasRole(DEFAULT_ADMIN_ROLE, deployer), "deployer should have DEFAULT_ADMIN_ROLE");
    }

    function test_DeployerHasAdminRole() public view {
        require(token.hasRole(adminRole, deployer), "deployer should have ADMIN_ROLE");
    }

    function test_DeployerIsAutomaticallyAllowListed() public view {
        require(token.isAllowListed(deployer), "deployer should be allow listed");
    }

    // ============ AllowList Management Tests ============

    function test_AddToAllowList() public {
        address newUser = address(0x100);
        token.addToAllowList(newUser);
        require(token.isAllowListed(newUser), "user should be allow listed");
    }

    function test_AddToAllowList_EmitsEvent() public {
        address newUser = address(0x100);
        vm.expectEmit(address(token));
        emit FoRToken.AllowListAdded(newUser);
        token.addToAllowList(newUser);
    }

    function test_AddToAllowList_RevertsIfAlreadyAllowListed() public {
        vm.expectRevert(FoRToken.AlreadyAllowListed.selector);
        token.addToAllowList(user1); // user1 was added in setUp
    }

    function test_AddToAllowList_RevertsIfNotAdmin() public {
        address newUser = address(0x100);
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                user1,
                adminRole
            )
        );
        token.addToAllowList(newUser);
    }

    function test_AddToAllowList_AdminRoleCanAdd() public {
        token.grantRole(adminRole, adminSigner);
        address newUser = address(0x100);
        vm.prank(adminSigner);
        token.addToAllowList(newUser);
        require(token.isAllowListed(newUser), "user should be allow listed");
    }

    function test_RemoveFromAllowList() public {
        token.removeFromAllowList(user1);
        require(!token.isAllowListed(user1), "user1 should not be allow listed");
    }

    function test_RemoveFromAllowList_EmitsEvent() public {
        vm.expectEmit(address(token));
        emit FoRToken.AllowListRemoved(user1);
        token.removeFromAllowList(user1);
    }

    function test_RemoveFromAllowList_RevertsIfNotInAllowList() public {
        address newUser = address(0x100);
        vm.expectRevert(abi.encodeWithSelector(FoRToken.NotAllowListed.selector, newUser));
        token.removeFromAllowList(newUser);
    }

    function test_RemoveFromAllowList_RevertsIfNotAdmin() public {
        vm.prank(user2);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                user2,
                adminRole
            )
        );
        token.removeFromAllowList(user1);
    }

    // ============ EIP712 Signature Tests ============

    function test_AddToAllowListWithSignature() public {
        // Add adminSigner as admin
        token.grantRole(adminRole, adminSigner);
        
        address newUser = address(0x100);
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(token.ADD_TO_ALLOWLIST_TYPEHASH(), newUser, deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        token.addToAllowListWithSignature(newUser, deadline, signature);
        
        require(token.isAllowListed(newUser), "user should be allow listed");
    }

    function test_AddToAllowListWithSignature_EmitsEvent() public {
        token.grantRole(adminRole, adminSigner);
        
        address newUser = address(0x100);
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(token.ADD_TO_ALLOWLIST_TYPEHASH(), newUser, deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectEmit(address(token));
        emit FoRToken.AllowListAdded(newUser);
        token.addToAllowListWithSignature(newUser, deadline, signature);
    }

    function test_AddToAllowListWithSignature_RevertsIfExpired() public {
        token.grantRole(adminRole, adminSigner);
        
        address newUser = address(0x100);
        uint256 deadline = block.timestamp - 1; // Already expired
        
        bytes32 structHash = keccak256(
            abi.encode(token.ADD_TO_ALLOWLIST_TYPEHASH(), newUser, deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert(FoRToken.SignatureExpired.selector);
        token.addToAllowListWithSignature(newUser, deadline, signature);
    }

    function test_AddToAllowListWithSignature_RevertsIfAlreadyAllowListed() public {
        token.grantRole(adminRole, adminSigner);
        
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(token.ADD_TO_ALLOWLIST_TYPEHASH(), user1, deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert(FoRToken.AlreadyAllowListed.selector);
        token.addToAllowListWithSignature(user1, deadline, signature);
    }

    function test_AddToAllowListWithSignature_RevertsIfSignerNotAdmin() public {
        // adminSigner is NOT added as admin
        address newUser = address(0x100);
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(token.ADD_TO_ALLOWLIST_TYPEHASH(), newUser, deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert(FoRToken.InvalidSignature.selector);
        token.addToAllowListWithSignature(newUser, deadline, signature);
    }

    function test_AddToAllowListWithSignature_RevertsIfInvalidSignature() public {
        token.grantRole(adminRole, adminSigner);
        
        address newUser = address(0x100);
        uint256 deadline = block.timestamp + 1 hours;
        
        // Sign with wrong account data
        bytes32 structHash = keccak256(
            abi.encode(token.ADD_TO_ALLOWLIST_TYPEHASH(), address(0x999), deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Try to use signature for different account
        vm.expectRevert(FoRToken.InvalidSignature.selector);
        token.addToAllowListWithSignature(newUser, deadline, signature);
    }

    function test_AddToAllowListWithSignature_AnyoneCanCall() public {
        token.grantRole(adminRole, adminSigner);
        
        address newUser = address(0x100);
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(token.ADD_TO_ALLOWLIST_TYPEHASH(), newUser, deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Anyone (user2) can call the function
        vm.prank(user2);
        token.addToAllowListWithSignature(newUser, deadline, signature);
        
        require(token.isAllowListed(newUser), "user should be allow listed");
    }

    // ============ Transfer Restriction Tests ============

    function test_Transfer_RevertsIfSenderNotAllowListed() public {
        address notAllowListed = address(0x100);
        
        // Give some tokens to notAllowListed
        token.addToAllowList(notAllowListed);
        token.transfer(notAllowListed, 100 ether);
        token.removeFromAllowList(notAllowListed);
        
        vm.prank(notAllowListed);
        vm.expectRevert(abi.encodeWithSelector(FoRToken.NotAllowListed.selector, notAllowListed));
        token.transfer(user1, 50 ether);
    }

    function test_Transfer_RevertsIfRecipientNotAllowListed() public {
        address notAllowListed = address(0x100);
        
        vm.expectRevert(abi.encodeWithSelector(FoRToken.NotAllowListed.selector, notAllowListed));
        token.transfer(notAllowListed, 100 ether);
    }

    function test_Transfer_SucceedsIfBothAllowListed() public {
        uint256 amount = 100 ether;
        
        token.transfer(user1, amount);
        
        require(token.balanceOf(user1) == amount, "transfer should succeed");
    }

    function test_TransferFrom_RevertsIfFromNotAllowListed() public {
        address notAllowListed = address(0x100);
        
        // Give some tokens and approval
        token.addToAllowList(notAllowListed);
        token.transfer(notAllowListed, 100 ether);
        token.removeFromAllowList(notAllowListed);
        
        vm.prank(notAllowListed);
        token.approve(user1, 100 ether);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(FoRToken.NotAllowListed.selector, notAllowListed));
        token.transferFrom(notAllowListed, user2, 50 ether);
    }

    function test_TransferFrom_RevertsIfToNotAllowListed() public {
        address notAllowListed = address(0x100);
        
        token.approve(user1, 100 ether);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(FoRToken.NotAllowListed.selector, notAllowListed));
        token.transferFrom(deployer, notAllowListed, 50 ether);
    }

    function test_TransferFrom_SucceedsIfBothAllowListed() public {
        uint256 amount = 100 ether;
        
        token.approve(user1, amount);
        
        vm.prank(user1);
        token.transferFrom(deployer, user2, amount);
        
        require(token.balanceOf(user2) == amount, "transfer should succeed");
    }

    // ============ Helper Functions ============

    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                token.DOMAIN_SEPARATOR(),
                structHash
            )
        );
    }
}
