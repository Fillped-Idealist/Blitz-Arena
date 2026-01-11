// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Types} from "./Types.sol";

/// @title GameRegistry
/// @notice 管理游戏类型注册、验证游戏结果和防止作弊的注册合约
contract GameRegistry is AccessControl {
    bytes32 public constant GAME_ADMIN_ROLE = keccak256("GAME_ADMIN_ROLE");

    // 游戏启用状态映射
    mapping(Types.GameType => bool) public gameEnabled;

    // 防止刷分：记录玩家上次游戏时间
    mapping(address => mapping(Types.GameType => uint256)) public lastPlayedTime;

    // 最小游戏间隔（防止重复提交）
    uint256 public constant MIN_GAME_INTERVAL = 10 seconds;

    // 游戏元数据验证规则
    mapping(Types.GameType => uint256) public maxScores; // 各游戏最大分数限制

    // 事件
    event GameEnabled(Types.GameType gameType);
    event GameDisabled(Types.GameType gameType);
    event GameResultVerified(
        address indexed player,
        Types.GameType gameType,
        uint256 score,
        bytes32 gameHash
    );
    event MaxScoreUpdated(Types.GameType gameType, uint256 maxScore);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(GAME_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        // 启用默认游戏
        gameEnabled[Types.GameType.NumberGuess] = true;
        gameEnabled[Types.GameType.RockPaperScissors] = true;
        gameEnabled[Types.GameType.QuickClick] = true;
        gameEnabled[Types.GameType.InfiniteMatch] = true;

        // 设置各游戏最大分数限制
        maxScores[Types.GameType.NumberGuess] = 100; // 猜数字最高100分
        maxScores[Types.GameType.RockPaperScissors] = 100; // 猜拳最高100分
        maxScores[Types.GameType.QuickClick] = 50; // 30秒内最多点击50次（合理上限）
        maxScores[Types.GameType.InfiniteMatch] = 10000; // 无限消除最高10000分（理论最大值）

        emit GameEnabled(Types.GameType.NumberGuess);
        emit GameEnabled(Types.GameType.RockPaperScissors);
        emit GameEnabled(Types.GameType.QuickClick);
        emit GameEnabled(Types.GameType.InfiniteMatch);
    }

    /// @notice 管理员启用游戏
    function enableGame(Types.GameType gameType) external onlyRole(GAME_ADMIN_ROLE) {
        require(gameType != Types.GameType.None, "Invalid game type");
        gameEnabled[gameType] = true;
        emit GameEnabled(gameType);
    }

    /// @notice 管理员禁用游戏
    function disableGame(Types.GameType gameType) external onlyRole(GAME_ADMIN_ROLE) {
        gameEnabled[gameType] = false;
        emit GameDisabled(gameType);
    }

    /// @notice 更新游戏最大分数限制
    function updateMaxScore(Types.GameType gameType, uint256 newMaxScore)
        external
        onlyRole(GAME_ADMIN_ROLE)
    {
        maxScores[gameType] = newMaxScore;
        emit MaxScoreUpdated(gameType, newMaxScore);
    }

    /// @notice 验证游戏结果（核心防作弊逻辑）
    /// @param result 游戏结果数据
    /// @return bool 验证是否通过
    function verifyGameResult(Types.GameResult calldata result) external returns (bool) {
        // 1. 检查游戏是否启用
        require(gameEnabled[result.gameType], "Game type not enabled");
        require(result.gameType != Types.GameType.None, "Invalid game type");

        // 2. 检查玩家是否在合理间隔内
        uint256 lastTime = lastPlayedTime[result.player][result.gameType];
        require(block.timestamp >= lastTime + MIN_GAME_INTERVAL, "Too frequent submissions");
        lastPlayedTime[result.player][result.gameType] = block.timestamp;

        // 3. 验证分数不超过最大值
        require(result.score <= maxScores[result.gameType], "Score exceeds maximum");

        // 4. 验证时间戳合理（不能是未来时间）
        require(result.timestamp <= block.timestamp, "Invalid timestamp");
        require(result.timestamp >= block.timestamp - 1 days, "Timestamp too old");

        // 5. 验证游戏哈希（确保数据未被篡改）
        bytes32 computedHash = computeGameHash(result);
        require(computedHash == result.gameHash, "Game hash mismatch");

        // 6. 根据游戏类型进行特定验证
        _validateGameSpecificRules(result);

        emit GameResultVerified(result.player, result.gameType, result.score, result.gameHash);

        return true;
    }

    /// @notice 计算游戏数据哈希（用于验证数据完整性）
    function computeGameHash(Types.GameResult calldata result) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                result.gameType,
                result.player,
                result.score,
                result.timestamp,
                result.metadata
            )
        );
    }

    /// @notice 游戏特定规则验证
    function _validateGameSpecificRules(Types.GameResult calldata result) private pure {
        if (result.gameType == Types.GameType.NumberGuess) {
            // 猜数字游戏验证
            require(result.metadata.length >= 1, "Missing game metadata");
            // metadata[0] 应该是猜测次数（1-5次）
            uint256 attempts = result.metadata[0];
            require(attempts > 0 && attempts <= 5, "Invalid attempt count");
            // 分数应该是 (6 - attempts) * 20
            uint256 expectedScore = (6 - attempts) * 20;
            require(result.score == expectedScore, "Score does not match attempts");

        } else if (result.gameType == Types.GameType.RockPaperScissors) {
            // 石头剪刀布游戏验证
            require(result.metadata.length >= 3, "Missing game metadata");
            // metadata[0] = 玩家胜利次数, metadata[1] = 平局次数, metadata[2] = 失败次数
            uint256 wins = result.metadata[0];
            uint256 draws = result.metadata[1];
            uint256 losses = result.metadata[2];
            require(wins + draws + losses == 10, "Invalid total rounds");
            // 分数应该是 wins * 10 + draws * 5
            uint256 expectedScore = wins * 10 + draws * 5;
            require(result.score == expectedScore, "Score does not match results");

        } else if (result.gameType == Types.GameType.QuickClick) {
            // 快速点击游戏验证
            require(result.metadata.length >= 1, "Missing game metadata");
            // metadata[0] = 实际点击次数
            uint256 clicks = result.metadata[0];
            // 30秒内最多50次点击（每次至少0.6秒）
            require(clicks <= 50, "Too many clicks");
            // 分数应该等于点击次数
            require(result.score == clicks, "Score does not match click count");

        } else if (result.gameType == Types.GameType.InfiniteMatch) {
            // 无限消除游戏验证
            require(result.metadata.length >= 3, "Missing game metadata");
            // metadata[0] = 最终得分, metadata[1] = 到达关卡, metadata[2] = 最大连击
            uint256 finalScore = result.metadata[0];
            uint256 level = result.metadata[1];
            uint256 maxCombo = result.metadata[2];

            // 验证关卡合理性（至少到达第1关）
            require(level >= 1, "Invalid level");
            require(maxCombo >= 1, "Invalid max combo");

            // 验证分数合理性
            // 基础分数计算：每关至少有60个方块（10x6），至少需要30次消除
            // 每次消除基础10分，加上连击加成
            // 所以第1关至少300分
            uint256 minExpectedScore = level * 300;
            require(finalScore >= minExpectedScore, "Score too low for level");

            // 验证分数不超过理论最大值
            // 假设每关平均1000分，最多10关
            uint256 maxExpectedScore = level * 1000;
            require(finalScore <= maxExpectedScore, "Score too high for level");

            // 验证提交的分数与metadata中的分数一致
            require(result.score == finalScore, "Score mismatch with metadata");
        }
    }

    /// @notice 获取游戏信息
    function getGameInfo(Types.GameType gameType)
        external
        view
        returns (
            bool enabled,
            uint256 maxScore
        )
    {
        return (gameEnabled[gameType], maxScores[gameType]);
    }

    /// @notice 检查玩家是否可以进行游戏
    function canPlayerPlay(address player, Types.GameType gameType)
        external
        view
        returns (bool)
    {
        uint256 lastTime = lastPlayedTime[player][gameType];
        return block.timestamp >= lastTime + MIN_GAME_INTERVAL;
    }
}
