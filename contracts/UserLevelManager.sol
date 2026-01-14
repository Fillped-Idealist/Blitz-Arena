// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title UserLevelManager
 * @notice 管理用户等级和代币奖励的合约
 * @dev 1 BLZ Token = 1 EXP，等级计算基于累积经验值
 */
contract UserLevelManager is AccessControl {
    address immutable BLZ_TOKEN_ADDRESS;

    // 用户数据结构
    struct UserData {
        uint256 totalExp;       // 总经验值（累积获得的 BLZ 代币数量）
        uint256 currentLevel;   // 当前等级
        uint256 expForNextLevel; // 升级到下一级所需的经验
    }

    mapping(address => UserData) public users;

    // 成就定义
    struct Achievement {
        string name;
        string description;
        uint256 reward; // 奖励的 BLZ 代币数量
        bool isActive;
    }

    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint256 => bool)) public achievementUnlocked;

    uint256 public constant MAX_LEVEL = 100;
    uint256 public constant BASE_EXP_NEEDED = 100; // 1级升到2级需要的经验
    uint256 public constant EXP_MULTIPLIER = 15;  // 1.5倍递增 (使用 15 表示 1.5，因为 solidity 不支持小数)

    // 事件定义
    event ExpGained(address indexed user, uint256 amount, uint256 totalExp);
    event LevelUp(address indexed user, uint256 newLevel);
    event AchievementUnlocked(address indexed user, uint256 achievementId, uint256 reward);
    event TokensClaimed(address indexed user, uint256 amount);

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE"); // 游戏合约角色，可以授予奖励

    constructor(address blzTokenAddress) {
        BLZ_TOKEN_ADDRESS = blzTokenAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GAME_ROLE, msg.sender);
        _setRoleAdmin(GAME_ROLE, ADMIN_ROLE);

        // 初始化成就
        _initAchievements();
    }

    /**
     * @notice 计算升级到指定等级所需的总经验
     * @param level 目标等级
     * @return 升级所需的总经验
     */
    function getExpForLevel(uint256 level) public pure returns (uint256) {
        if (level == 0) return 0;
        if (level == 1) return 0;

        // 等级经验公式：递归计算，每级所需经验是前一级的 1.5 倍
        uint256 totalExp = 0;
        for (uint256 i = 1; i < level; i++) {
            totalExp += (BASE_EXP_NEEDED * EXP_MULTIPLIER ** (i - 1)) / 10;
        }
        return totalExp;
    }

    /**
     * @notice 获取用户的完整数据
     * @param user 用户地址
     * @return userData 用户数据
     */
    function getUserData(address user) external view returns (UserData memory userData) {
        return users[user];
    }

    /**
     * @notice 增加用户经验（由游戏合约调用）
     * @param user 用户地址
     * @param exp 经验值（BLZ 代币数量）
     */
    function addExp(address user, uint256 exp) external onlyRole(GAME_ROLE) {
        require(exp > 0, "Exp must be positive");
        require(user != address(0), "Invalid user address");

        UserData storage userData = users[user];
        userData.totalExp += exp;

        // 检查是否升级
        uint256 potentialLevel = _calculateLevel(userData.totalExp);
        if (potentialLevel > userData.currentLevel && potentialLevel <= MAX_LEVEL) {
            userData.currentLevel = potentialLevel;
            userData.expForNextLevel = getExpForLevel(potentialLevel + 1) - userData.totalExp;
            emit LevelUp(user, potentialLevel);
        }

        emit ExpGained(user, exp, userData.totalExp);
    }

    /**
     * @notice 解锁成就
     * @param user 用户地址
     * @param achievementId 成就ID
     */
    function unlockAchievement(address user, uint256 achievementId) external onlyRole(GAME_ROLE) {
        require(achievementId > 0 && achievementId <= 7, "Invalid achievement ID");
        require(!achievementUnlocked[user][achievementId], "Achievement already unlocked");

        Achievement storage achievement = achievements[achievementId];
        require(achievement.isActive, "Achievement not active");

        achievementUnlocked[user][achievementId] = true;

        // 发放奖励
        if (achievement.reward > 0) {
            _awardTokens(user, achievement.reward);
        }

        emit AchievementUnlocked(user, achievementId, achievement.reward);
    }

    /**
     * @notice 检查用户是否解锁了指定成就
     */
    function hasAchievement(address user, uint256 achievementId) external view returns (bool) {
        return achievementUnlocked[user][achievementId];
    }

    /**
     * @notice 获取成就信息
     */
    function getAchievement(uint256 achievementId) external view returns (Achievement memory) {
        return achievements[achievementId];
    }

    /**
     * @notice 内部函数：授予用户代币
     */
    function _awardTokens(address user, uint256 amount) private {
        IERC20 token = IERC20(BLZ_TOKEN_ADDRESS);
        require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");

        bool success = token.transfer(user, amount);
        require(success, "Token transfer failed");

        emit TokensClaimed(user, amount);
    }

    /**
     * @notice 根据总经验计算等级
     */
    function _calculateLevel(uint256 totalExp) private pure returns (uint256) {
        if (totalExp == 0) return 1;

        uint256 level = 1;
        uint256 expNeeded = 0;

        while (level < MAX_LEVEL) {
            uint256 nextLevelExp = getExpForLevel(level + 1);
            if (totalExp >= nextLevelExp) {
                level++;
            } else {
                break;
            }
        }

        return level;
    }

    /**
     * @notice 初始化成就系统
     */
    function _initAchievements() private {
        // 游戏类成就
        achievements[1] = Achievement({
            name: "First Win",
            description: "Win your first tournament",
            reward: 20 * 10**18, // 20 BLZ
            isActive: true
        });

        achievements[2] = Achievement({
            name: "Champion",
            description: "Win 10 tournaments",
            reward: 100 * 10**18, // 100 BLZ
            isActive: true
        });

        achievements[3] = Achievement({
            name: "Game Master",
            description: "Participate in 50 tournaments",
            reward: 50 * 10**18, // 50 BLZ
            isActive: true
        });

        achievements[4] = Achievement({
            name: "High Scorer",
            description: "Score above 10000 points in Infinite Match",
            reward: 30 * 10**18, // 30 BLZ
            isActive: true
        });

        // 社交类成就
        achievements[5] = Achievement({
            name: "Social Butterfly",
            description: "Add 10 friends",
            reward: 25 * 10**18, // 25 BLZ
            isActive: true
        });

        achievements[6] = Achievement({
            name: "Popular",
            description: "Receive 50 likes on your profile",
            reward: 40 * 10**18, // 40 BLZ
            isActive: true
        });

        achievements[7] = Achievement({
            name: "Community Leader",
            description: "Create 10 tournaments",
            reward: 60 * 10**18, // 60 BLZ
            isActive: true
        });
    }

    /**
     * @notice 允许管理员添加代币到合约（用于奖励发放）
     */
    function addTokensToPool(uint256 amount) external onlyRole(ADMIN_ROLE) {
        IERC20 token = IERC20(BLZ_TOKEN_ADDRESS);
        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
    }

    /**
     * @notice 获取合约代币余额
     */
    function getTokenBalance() external view returns (uint256) {
        return IERC20(BLZ_TOKEN_ADDRESS).balanceOf(address(this));
    }
}
