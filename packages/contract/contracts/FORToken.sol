// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract FoRToken is ERC20, ERC20Permit, AccessControl {
    using ECDSA for bytes32;

    // ============ Constants ============
    /// @notice Admin role for managing allow list
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    /// @notice EIP712 typehash for AddToAllowList
    bytes32 public constant ADD_TO_ALLOWLIST_TYPEHASH =
        keccak256("AddToAllowList(address account,uint256 deadline)");

    // ============ State Variables ============
    mapping(address => bool) private _allowList;

    // ============ Events ============
    event AllowListAdded(address indexed account);
    event AllowListRemoved(address indexed account);

    // ============ Errors ============
    error NotAllowListed(address account);
    error InvalidSignature();
    error SignatureExpired();
    error AlreadyAllowListed();

    // ============ Constructor ============
    constructor(
        uint256 initialSupply,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC20Permit(name) {
        _mint(_msgSender(), initialSupply);
        
        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        
        // Add deployer to allow list
        _allowList[_msgSender()] = true;
        emit AllowListAdded(_msgSender());
    }

    // ============ AllowList Management ============

    /// @notice Add an address to the allow list (ADMIN_ROLE only)
    /// @param account Address to add
    function addToAllowList(address account) external onlyRole(ADMIN_ROLE) {
        if (_allowList[account]) revert AlreadyAllowListed();
        _allowList[account] = true;
        emit AllowListAdded(account);
    }

    /// @notice Remove an address from the allow list (ADMIN_ROLE only)
    /// @param account Address to remove
    function removeFromAllowList(address account) external onlyRole(ADMIN_ROLE) {
        if (!_allowList[account]) revert NotAllowListed(account);
        _allowList[account] = false;
        emit AllowListRemoved(account);
    }

    /// @notice Add an address to the allow list using EIP712 signature from an admin
    /// @param account Address to add
    /// @param deadline Signature expiration timestamp
    /// @param signature Admin's EIP712 signature
    function addToAllowListWithSignature(
        address account,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (block.timestamp > deadline) revert SignatureExpired();
        if (_allowList[account]) revert AlreadyAllowListed();

        bytes32 structHash = keccak256(
            abi.encode(ADD_TO_ALLOWLIST_TYPEHASH, account, deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        if (!hasRole(ADMIN_ROLE, signer)) revert InvalidSignature();

        _allowList[account] = true;
        emit AllowListAdded(account);
    }

    /// @notice Check if an address is on the allow list
    /// @param account Address to check
    /// @return bool True if the address is on the allow list
    function isAllowListed(address account) public view returns (bool) {
        return _allowList[account];
    }

    // ============ Transfer Restrictions ============

    /// @notice Override transfer to enforce allow list
    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        _requireBothAllowListed(_msgSender(), to);
        return super.transfer(to, amount);
    }

    /// @notice Override transferFrom to enforce allow list
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        _requireBothAllowListed(from, to);
        return super.transferFrom(from, to, amount);
    }

    // ============ Internal Functions ============

    /// @notice Require both addresses to be on the allow list
    /// @param from Sender address
    /// @param to Recipient address
    function _requireBothAllowListed(address from, address to) internal view {
        if (!_allowList[from]) revert NotAllowListed(from);
        if (!_allowList[to]) revert NotAllowListed(to);
    }

    // ============ ERC165 Interface Support ============

    /// @notice Override supportsInterface to support AccessControl
    /// @param interfaceId Interface identifier to check
    /// @return bool True if the interface is supported
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
