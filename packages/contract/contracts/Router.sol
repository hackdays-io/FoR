// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Router
 * @dev 寄付金の分配を管理するRouterコントラクト
 * 寄付金を基金、Burn、受取人の3つに分配します
 */
contract Router is AccessControl, Pausable, ReentrancyGuard {
    /// @notice カスタムエラー
    error InvalidAmount();
    error InvalidRecipient();
    error InvalidToken();

    /// @notice 基金管理者ロール
    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");

    /// @notice 分配比率管理者ロール
    bytes32 public constant RATIO_MANAGER_ROLE =
        keccak256("RATIO_MANAGER_ROLE");

    /// @notice Burnアドレス（0xdEaD...）
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @notice FORTokenコントラクトアドレス
    address public immutable forToken;

    /// @notice 基金への分配比率（基準: 10000 = 100%）
    uint256 public fundRatio;

    /// @notice Burnの分配比率（基準: 10000 = 100%）
    uint256 public burnRatio;

    /// @notice 基金ウォレットアドレス
    address public fundWallet;

    /**
     * @notice トークンが自動分配付きで送金された際に発行されるイベント
     * @param sender 送金を実行したアドレス (msg.sender)
     * @param from トークンの所有者アドレス
     * @param recipient 最終的にトークンを受け取るアドレス
     * @param totalAmount 分配前の総送金額
     * @param fundAmount 基金ウォレットへ送金された額
     * @param burnAmount Burnアドレスへ送金された額
     * @param recipientAmount 受取人が受け取った額
     */
    event TransferWithDistribution(
        address indexed sender,
        address indexed from,
        address indexed recipient,
        uint256 totalAmount,
        uint256 fundAmount,
        uint256 burnAmount,
        uint256 recipientAmount
    );

    /**
     * @dev コンストラクタ
     * @param _initialAdmin 初期管理者アドレス（全ロールを付与）
     * @param _forToken FORTokenコントラクトアドレス
     * @param _fundWallet 基金ウォレットアドレス
     * @param _fundRatio 基金への分配比率（基準: 10000 = 100%）
     * @param _burnRatio Burnの分配比率（基準: 10000 = 100%）
     */
    constructor(
        address _initialAdmin,
        address _forToken,
        address _fundWallet,
        uint256 _fundRatio,
        uint256 _burnRatio
    ) {
        require(_initialAdmin != address(0), "Invalid initial admin address");
        require(_forToken != address(0), "Invalid token address");
        forToken = _forToken;
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

    /**
     * @notice permit署名を使用してトークンを送金し、自動分配を実行
     * @dev permitを実行した後、基金・Burn・受取人へトークンを分配
     * @param from トークン所有者アドレス（permit署名と一致する必要あり）
     * @param recipient 分配後の残りトークンを受け取るアドレス
     * @param amount 送金総額（分配前）
     * @param deadline permit署名の有効期限
     * @param v 署名コンポーネント v
     * @param r 署名コンポーネント r
     * @param s 署名コンポーネント s
     */
    function transferWithPermit(
        address from,
        address recipient,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused nonReentrant {
        // 入力値の検証
        if (amount == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();

        // permitを実行してこのコントラクトを承認
        IERC20Permit(forToken).permit(
            from,
            address(this),
            amount,
            deadline,
            v,
            r,
            s
        );

        // 分配額を計算
        uint256 fundAmount = (amount * fundRatio) / 10000;
        uint256 burnAmount = (amount * burnRatio) / 10000;
        uint256 recipientAmount = amount - fundAmount - burnAmount;

        // 送金を実行
        IERC20 token = IERC20(forToken);

        if (fundAmount > 0) {
            require(
                token.transferFrom(from, fundWallet, fundAmount),
                "Fund transfer failed"
            );
        }

        if (burnAmount > 0) {
            require(
                token.transferFrom(from, BURN_ADDRESS, burnAmount),
                "Burn transfer failed"
            );
        }

        if (recipientAmount > 0) {
            require(
                token.transferFrom(from, recipient, recipientAmount),
                "Recipient transfer failed"
            );
        }

        // イベントを発行
        emit TransferWithDistribution(
            msg.sender,
            from,
            recipient,
            amount,
            fundAmount,
            burnAmount,
            recipientAmount
        );
    }
}
