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
     * @param message 送金時に添付されたメッセージ
     */
    event TransferWithDistribution(
        address indexed sender,
        address indexed from,
        address indexed recipient,
        uint256 totalAmount,
        uint256 fundAmount,
        uint256 burnAmount,
        uint256 recipientAmount,
        string message
    );

    /**
     * @notice 分配比率が更新された際に発行されるイベント
     * @param changedBy 比率を更新したアドレス
     * @param fundRatio 更新後の基金への分配比率
     * @param burnRatio 更新後のBurnへの分配比率
     * @param recipientRatio 更新後の受取人への分配比率
     */
    event DistributionRatioUpdated(
        address indexed changedBy,
        uint256 fundRatio,
        uint256 burnRatio,
        uint256 recipientRatio
    );

    /**
     * @dev 分配額を計算する内部関数（上乗せ方式）
     * @notice 基金・Burn は受取人が受け取る額に対して計算し、合計に上乗せする。
     *         受取人は recipientAmount をそのまま受け取り、from は totalAmount を支払う。
     * @param recipientAmount 受取人が受け取る額（送る額）
     * @return fundAmount 基金へ上乗せされる額（= recipientAmount * fundRatio / 10000）
     * @return burnAmount Burnへ上乗せされる額（= recipientAmount * burnRatio / 10000）
     * @return totalAmount from から引かれる合計額（= recipientAmount + fundAmount + burnAmount）
     */
    function _calculateDistribution(
        uint256 recipientAmount
    ) internal view returns (uint256 fundAmount, uint256 burnAmount, uint256 totalAmount) {
        fundAmount = (recipientAmount * fundRatio) / 10000;
        burnAmount = (recipientAmount * burnRatio) / 10000;
        totalAmount = recipientAmount + fundAmount + burnAmount;
    }

    /**
     * @dev 分配送金を実行する内部関数（transferFromを実行）
     * @param from 送金元アドレス
     * @param recipient 受取人アドレス
     * @param fundAmount 基金への額
     * @param burnAmount Burnへの額
     * @param recipientAmount 受取人への額
     */
    function _executeDistribution(
        address from,
        address recipient,
        uint256 fundAmount,
        uint256 burnAmount,
        uint256 recipientAmount
    ) internal {
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
    }

    /**
     * @dev 分配額の計算・送金・イベント発行をまとめた内部関数。
     *      transferWithDistribution / transferWithPermit から共通利用する。
     *      （emit を独立関数に切り出し、署名引数の多い呼び出し元のスタック深度を抑える目的も兼ねる）
     * @param from トークン所有者アドレス
     * @param recipient トークンを受け取るアドレス
     * @param amount 受取人が受け取る額（基金・Burn はこの額に上乗せ）
     * @param message 送金時に添付するメッセージ
     */
    function _distribute(
        address from,
        address recipient,
        uint256 amount,
        string calldata message
    ) internal {
        (uint256 fundAmount, uint256 burnAmount, uint256 totalAmount) =
            _calculateDistribution(amount);

        // 受取人は amount をそのまま受け取り、from は totalAmount を支払う
        _executeDistribution(from, recipient, fundAmount, burnAmount, amount);

        emit TransferWithDistribution(
            msg.sender,
            from,
            recipient,
            totalAmount,
            fundAmount,
            burnAmount,
            amount,
            message
        );
    }

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
        emit DistributionRatioUpdated(
            msg.sender,
            fundRatio,
            burnRatio,
            10000 - fundRatio - burnRatio
        );
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
        emit DistributionRatioUpdated(
            msg.sender,
            fundRatio,
            burnRatio,
            10000 - fundRatio - burnRatio
        );
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
     * @param recipient トークンを受け取るアドレス
     * @param amount 受取人が受け取る額（基金・Burn はこの額に上乗せして引かれる）
     * @param deadline permit署名の有効期限
     * @param v 署名コンポーネント v
     * @param r 署名コンポーネント r
     * @param s 署名コンポーネント s
     * @param message 送金時に添付するメッセージ
     */
    function transferWithPermit(
        address from,
        address recipient,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string calldata message
    ) external whenNotPaused nonReentrant {
        // 入力値の検証
        if (amount == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();

        // permit は合計額（受取額 + 上乗せ分）を承認する必要がある
        (, , uint256 totalAmount) = _calculateDistribution(amount);
        IERC20Permit(forToken).permit(
            from,
            address(this),
            totalAmount,
            deadline,
            v,
            r,
            s
        );

        // 分配・送金・イベント発行
        _distribute(from, recipient, amount, message);
    }

    /**
     * @notice 事前承認を前提とした分配送金
     * @dev AAユーザーやEOAの事前approve後の実行用。permitは使用しない。
     * @param from トークン所有者アドレス（approve済みであること）
     * @param recipient トークンを受け取るアドレス
     * @param amount 受取人が受け取る額（基金・Burn はこの額に上乗せして引かれる）
     * @param message 送金時に添付するメッセージ
     */
    function transferWithDistribution(
        address from,
        address recipient,
        uint256 amount,
        string calldata message
    ) external whenNotPaused nonReentrant {
        // 入力値の検証
        if (amount == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();

        // 分配・送金・イベント発行（approve前提）
        _distribute(from, recipient, amount, message);
    }
}
