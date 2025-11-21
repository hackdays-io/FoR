// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Router
 * @dev 寄付金の分配を管理するRouterコントラクト
 * 寄付金を基金、Burn、受取人の3つに分配します
 */
contract Router is AccessControl {
    /// @notice Burnアドレス（0x0）
    address public constant BURN_ADDRESS = address(0);
    
    /// @notice 基金への分配比率（基準: 10000 = 100%）
    uint256 public fundRatio;
    
    /// @notice Burnの分配比率（基準: 10000 = 100%）
    uint256 public burnRatio;
    
    /// @notice 基金ウォレットアドレス
    address public fundWallet;
    
    /**
     * @dev コンストラクタ
     * @param _fundWallet 基金ウォレットアドレス
     * @param _fundRatio 基金への分配比率（基準: 10000 = 100%）
     * @param _burnRatio Burnの分配比率（基準: 10000 = 100%）
     */
    constructor(
        address _fundWallet,
        uint256 _fundRatio,
        uint256 _burnRatio
    ) {
        fundWallet = _fundWallet;
        fundRatio = _fundRatio;
        burnRatio = _burnRatio;
    }
}

