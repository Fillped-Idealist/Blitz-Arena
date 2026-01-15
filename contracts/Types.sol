// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/// @title Types
/// @notice 包含项目使用的所有共享类型定义
contract Types {

    /// @dev 比赛的生命周期状态
    enum GameStatus {
        Created,            // 比赛已创建，等待报名
        Ongoing,            // 比赛进行中，玩家可提交成绩
        Ended,              // 比赛结束，等待设置胜者和分发奖金
        PrizeDistributed,    // 奖金已分发
        Canceled
    }

    /// @dev 游戏类型枚举
    enum GameType {
        None,               // 无游戏类型（默认值）
        NumberGuess,        // 猜数字游戏
        RockPaperScissors,  // 石头剪刀布
        QuickClick,         // 快速点击
        RoguelikeSurvival,  // 肉鸽割草游戏（Cycle Rift）
        InfiniteMatch       // 无限消除游戏
    }

    /// @dev 游戏结果结构体（用于链上验证）
    struct GameResult {
        GameType gameType;              // 游戏类型
        address player;                 // 玩家地址
        uint256 score;                  // 游戏得分
        uint256 timestamp;              // 游戏完成时间戳
        bytes32 gameHash;               // 游戏数据哈希（防篡改）
        uint256[] metadata;             // 游戏元数据（具体游戏特定数据）
    }

    /// @dev 玩家信息结构体
    struct PlayerInfo {
        address player; // 玩家地址
        uint score;     // 玩家成绩
    }

    /// @dev 奖金分配方式
    enum PrizeDistributionType {
        WinnerTakesAll, // 胜者全得 (100% 给第一名)
        AverageSplit,   // 平均分配 (奖池平均分配给所有参赛者)
        CustomRanked    // 自定义排名奖励 (使用 prizeDistribution 映射)
    }

    /// @dev 创建新比赛实例时所需配置
    struct GameConfig {
        string title;               // 比赛名称
        string description;         // 比赛描述
        GameType gameType;          // 新增：比赛关联的游戏类型

        address feeTokenAddress;    // 报名费使用的 ERC20 代币地址
        uint entryFee;              // 每位玩家的报名费 (代币数量)

        uint minPlayers;            // 最小玩家数量
        uint maxPlayers;            // 最大玩家数量

        uint registrationEndTime;   // 报名截止时间 (Unix timestamp)
        uint gameStartTime;         // 比赛开始时间 (Unix timestamp)
        uint gameEndTime;           // 比赛结束时间 (Unix timestamp)

        address prizeTokenAddress;  // 奖金使用的 ERC20 代币地址
        uint prizePool;             // 奖池

        PrizeDistributionType distributionType; // 奖励分配方式
        // 排名奖励配置 (仅 CustomRanked 使用)
        uint[] rankPrizes; // 索引作为排名，奖励百分比 (基点 BPS: 10000 = 100%)
    }

    /// @dev 比赛的信息
    struct GameData {
        address creator;
        string title;
        string description;
        GameStatus status;
        GameType gameType;              // 新增：比赛关联的游戏类型

        uint maxPlayers;
        uint playerCount;

        uint registrationEndTime;
        uint gameStartTime;

        address feeToken;
        uint entryFee;

        address prizeToken;
        uint prizePool;
    }
}