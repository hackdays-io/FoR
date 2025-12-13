// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Router
 * @dev 寄付金の分配を管理するRouterコントラクト
 * 寄付金を基金、Burn、受取人の3つに分配します
 */
contract Router is AccessControl, Pausable {
    /// @notice 基金管理者ロール
    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");

    /// @notice 分配比率管理者ロール
    bytes32 public constant RATIO_MANAGER_ROLE =
        keccak256("RATIO_MANAGER_ROLE");

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
     * @param _initialAdmin 初期管理者アドレス（全ロールを付与）
     * @param _fundWallet 基金ウォレットアドレス
     * @param _fundRatio 基金への分配比率（基準: 10000 = 100%）
     * @param _burnRatio Burnの分配比率（基準: 10000 = 100%）
     */
    constructor(
        address _initialAdmin,
        address _fundWallet,
        uint256 _fundRatio,
        uint256 _burnRatio
    ) {
        require(_initialAdmin != address(0), "Invalid initial admin address");
        fundWallet = _fundWallet;
        fundRatio = _fundRatio;
        burnRatio = _burnRatio;

        // デフォルト管理者ロールの設定
        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(FUND_MANAGER_ROLE, _initialAdmin);
        _grantRole(RATIO_MANAGER_ROLE, _initialAdmin);
    }

    /**
     * @dev 基金の分配比率を更新する
     * @param _fundRatio 新しい基金への分配比率（基準: 10000 = 100%）
     */
    function setFundRatio(
        uint256 _fundRatio
    ) external onlyRole(RATIO_MANAGER_ROLE) whenNotPaused {
        require(_fundRatio + burnRatio <= 10000, "Total ratio exceeds 100%");
        fundRatio = _fundRatio;
    }

    /**
     * @dev Burnの分配比率を更新する
     * @param _burnRatio 新しいBurnの分配比率（基準: 10000 = 100%）
     */
    function setBurnRatio(
        uint256 _burnRatio
    ) external onlyRole(RATIO_MANAGER_ROLE) whenNotPaused {
        require(fundRatio + _burnRatio <= 10000, "Total ratio exceeds 100%");
        burnRatio = _burnRatio;
    }

    /**
     * @dev 基金ウォレットアドレスを更新する
     * @param _fundWallet 新しい基金ウォレットアドレス
     */
    function setFundWallet(
        address _fundWallet
    ) external onlyRole(FUND_MANAGER_ROLE) whenNotPaused {
        require(_fundWallet != address(0), "Invalid fund wallet address");
        fundWallet = _fundWallet;
    }

    /**
     * @dev コントラクトを一時停止する
     * @notice DEFAULT_ADMIN_ROLEのみが実行可能
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev コントラクトの一時停止を解除する
     * @notice DEFAULT_ADMIN_ROLEのみが実行可能
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
