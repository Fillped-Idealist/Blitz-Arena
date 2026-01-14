// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
// import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Types} from "./Types.sol"; // 引入公共类型库
import {GameRegistry} from "./GameRegistry.sol";
import {UserLevelManager} from "./UserLevelManager.sol";

/// @title GameInstance (合并版 V3)
contract GameInstance is AccessControl {
    // using Types for *; 

    // AccessControl 的管理员角色哈希
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bool private initialized;

    // Game Registry 和 Level Manager 地址
    address public gameRegistry;
    address public levelManager;

    // ====== 比赛基础数据（由 initialize 设置） ======
    address public creator;
    string public title;
    string public description;
    Types.GameType public gameType; // 新增：游戏类型

    uint public minPlayers;
    uint public maxPlayers;
    
    uint public registrationEndTime;
    uint public gameStartTime;

    address public feeToken;
    uint public entryFee;
    mapping(address => uint) playerEntryFees;

    address public prizeToken;
    uint public prizePool;
    Types.PrizeDistributionType public distributionType;
    uint[] public rankPrizes; //索引作为排名
    mapping(address => uint) public prizeToClaimsAmount; // 玩家地址 => 可领取的奖金数量


    // ====== 比赛状态数据 ======
    Types.GameStatus public status;                  
    Types.PlayerInfo[] public players;
    mapping(address => bool) public isJoined;              
    mapping(address => uint) internal scores;
    mapping(address => Types.GameResult) public gameResults; // 新增：存储玩家的游戏结果                      
    address[] public winners;


    // ====== 事件 ======
    event Initialized(address creator, string title);
    event PlayerJoined(address player);
    event ScoreSubmitted(address player, uint score);
    event WinnersSet(address[] winner);
    event PrizeDistributed(address winner, uint amount);
    event FeeRefund(address player, uint amount);
    event GameStarted();
    event GameCanceled(address indexed creator, uint refundAmount);
    event PlayerUnregistered(address indexed player, uint feeRefunded);

    // ====== 修饰符 ======


    /// @notice 初始化函数
    function initialize(Types.GameConfig memory config, address _creator, address _levelManager) external {
        // ... (基础检查保持不变)
        require(!initialized, "Already initialized");
        initialized = true;

        // 设置 levelManager 地址
        levelManager = _levelManager;

        // 时间检查
        require(config.registrationEndTime > block.timestamp, "Reg end must be in future");
        require(config.gameStartTime >= config.registrationEndTime, "Game must start after reg ends");
        // 人数检查
        require(config.maxPlayers >= config.minPlayers, "Max must be >= Min");

        // 设置所有基础信息
        creator = _creator;
        title = config.title;
        description = config.description;
        status = Types.GameStatus.Created;
        gameType = config.gameType; // 新增：设置游戏类型

        feeToken = config.feeTokenAddress;
        entryFee = config.entryFee;

        minPlayers = config.minPlayers;
        maxPlayers = config.maxPlayers;

        registrationEndTime = config.registrationEndTime;
        gameStartTime = config.gameStartTime;
        
        prizeToken = config.prizeTokenAddress;
        prizePool = config.prizePool;
        distributionType = config.distributionType;
        rankPrizes = config.rankPrizes;

        // 自定义排名配置校验
        if (config.distributionType == Types.PrizeDistributionType.CustomRanked) {
            uint rankPrizesLength = config.rankPrizes.length;
            // 1. 长度检查：至少配置一个排名
            require(rankPrizes.length > 0, "Custom rank config format error");
            
            // 2. 总和检查：计算所有 BPS 总和
            uint totalBps = 0;
            for (uint i = 0; i < rankPrizesLength; i += 1) {
                totalBps += rankPrizes[i];
            }
            require(totalBps <= 10000, "Prize BPS exceeds 100%"); // 
        }
        
        // 设置权限 (使用 OpenZeppelin v5.x 标准的 _grantRole)
        _grantRole(DEFAULT_ADMIN_ROLE, _creator);
        _grantRole(CREATOR_ROLE, _creator);
        _setRoleAdmin(CREATOR_ROLE, DEFAULT_ADMIN_ROLE);
        
        emit Initialized(_creator, title);
    }

    /// @notice 设置 GameRegistry 地址（仅管理员可调用）
    function setGameRegistry(address _gameRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_gameRegistry != address(0), "Invalid game registry address");
        gameRegistry = _gameRegistry;
    }
    
    /// @notice 玩家报名参加比赛
    function joinGame() external {
        // 1. 检查状态和时间
        require(status == Types.GameStatus.Created, "Game not accepting players");
        require(block.timestamp < registrationEndTime, "Registration time passed"); // 检查报名时间
        // 2. 检查玩家数量
        require(players.length < maxPlayers, "Max players reached");

        // 3. 检查重复报名
        require(!isJoined[msg.sender], "Already joined");

        // 4. 处理报名费
        if (entryFee > 0) {
            // 从玩家地址转账 entryFee 到本合约作为奖金池的一部分
            require(IERC20(feeToken).transferFrom(msg.sender, address(this), entryFee), "Transfer failed");
        }

        // 5. 更新状态
        players.push(Types.PlayerInfo(msg.sender, 0));
        playerEntryFees[msg.sender] = entryFee;
        isJoined[msg.sender] = true; // 标记玩家已加入

        // 给参与者增加经验（通过 UserLevelManager）
        if (levelManager != address(0)) {
            UserLevelManager(levelManager).addExp(msg.sender, 3 * 10**18); // 3 BLZ = 3 经验
        }

        emit PlayerJoined(msg.sender);
    }

    /// @notice 玩家取消报名并同时拿回报名费
    function cancelRegistration() external {
        address player = msg.sender;
        
        // 1. 状态检查：必须在报名结束之前
        require(block.timestamp < registrationEndTime, "Registration time is over");
        // 仅允许在 Created 状态下取消报名
        require(status == Types.GameStatus.Created, "Game is already ongoing or ended"); 

        // 2. 检查玩家是否已报名
        uint feeAmount = playerEntryFees[player];
        require(feeAmount > 0, "Player has not joined or fee already refunded");

        // --- 3. 移除玩家数据 (O(N) 搜索 + O(1) 交换并弹出) ---
        
        // 3a. 找到玩家在 players 数组中的索引
        uint playerIndex;
        bool found = false;
        for (uint i = 0; i < players.length; i++) {
            if (players[i].player == player) {
                playerIndex = i;
                found = true;
                break;
            }
        }
        // 由于 feeAmount > 0，玩家理应在 players 数组中
        require(found, "Internal error: Player not found in list"); 
        
        // 3b. 交换并弹出：移动数组最后一个元素到当前位置，并移除最后一个元素
        uint lastIndex = players.length - 1;
        if (playerIndex != lastIndex) {
            players[playerIndex] = players[lastIndex];
        }
        players.pop(); // 移除最后一个元素

        // 4. 更新资金状态
        playerEntryFees[player] = 0; // 清零玩家的报名费记录
        prizePool -= feeAmount;      // 从奖池中移除这部分资金
        isJoined[player] = false;
        scores[player] = 0; // 清理玩家成绩记录// 5. 退还报名费 (使用 feeToken)
        require(IERC20(feeToken).transfer(player, feeAmount), "Refund transfer failed");

        // 6. 触发事件
        emit PlayerUnregistered(player, feeAmount);
    }
    
    /// @notice 比赛创建者/裁判调用此函数开始比赛
    function startGame() external onlyRole(CREATOR_ROLE) {
        require(status == Types.GameStatus.Created, "Game not in Created status");
        
        // 1. 检查时间是否已过（允许延迟启动）
        require(block.timestamp >= registrationEndTime, "Registration is not over yet"); 

        // 2. 检查最小人数，如果不足则自动取消并退款
        if (players.length < minPlayers) {
            // 自动取消比赛
            uint totalRefundAmount = prizePool;
            prizePool = 0;
            status = Types.GameStatus.Canceled;

            // 退还奖池给创建者
            if (totalRefundAmount > 0) {
                require(IERC20(prizeToken).transfer(creator, totalRefundAmount), "Prize refund failed");
            }

            // 退还所有玩家的报名费
            for (uint i = 0; i < players.length; i++) {
                address player = players[i].player;
                uint feeAmount = playerEntryFees[player];
                if (feeAmount > 0) {
                    playerEntryFees[player] = 0;
                    require(IERC20(feeToken).transfer(player, feeAmount), "Entry fee refund failed");
                    emit PlayerUnregistered(player, feeAmount);
                }
            }

            emit GameCanceled(creator, totalRefundAmount);
            return;
        }

        // 3. 开始比赛
        status = Types.GameStatus.Ongoing;
        emit GameStarted();
    }

    /// @notice 比赛创建者取消比赛，并退还奖池给创建者
    function cancelGame() external onlyRole(CREATOR_ROLE) {
        // 只能在 Created 或 Ongoing 阶段取消
        require(
            status == Types.GameStatus.Created || status == Types.GameStatus.Ongoing,
            "Cannot cancel an ended or distributed game"
        );
        
        uint refundAmount = prizePool;
        prizePool = 0; // 清空奖池

        // 1. 更新状态
        status = Types.GameStatus.Canceled; // 

        // 2. 将奖池中的所有代币退还给创建者
        if (refundAmount > 0) {
            // 注意：使用 prizeToken 进行转账，因为奖池中存储的是 prizeToken
            require(IERC20(prizeToken).transfer(creator, refundAmount), "Refund failed");
        }
        
        // 4. 触发事件
        emit GameCanceled(creator, refundAmount);
    }

    /// @notice 玩家提交比赛成绩（支持游戏结果验证）
    function submitScore(uint score) external {
        require(status == Types.GameStatus.Ongoing, "Game not ongoing");
        // 检查比赛是否已开始
        require(block.timestamp >= gameStartTime, "Game has not started yet"); 
        
        // 1. 检查是否已报名
        require(isJoined[msg.sender], "Player not joined");
        
        // 2. 检查是否已提交过分数 (此处逻辑可能需要修改：如果允许更新成绩，则移除此检查)
        // require(scores[msg.sender] == 0, "Score already submitted"); 

        scores[msg.sender] = score;

        emit ScoreSubmitted(msg.sender, score);
    }

    /// @notice 玩家提交游戏结果（通过GameRegistry验证）
    /// @param result 游戏结果数据
    function submitGameResult(Types.GameResult calldata result) external {
        require(status == Types.GameStatus.Ongoing, "Game not ongoing");
        // 检查比赛是否已开始
        require(block.timestamp >= gameStartTime, "Game has not started yet"); 

        // 1. 检查是否已报名
        require(isJoined[msg.sender], "Player not joined");

        // 2. 检查游戏类型是否匹配
        require(result.gameType == gameType, "Game type mismatch");
        require(result.player == msg.sender, "Player address mismatch");

        // 3. 调用GameRegistry验证游戏结果
        require(gameRegistry != address(0), "GameRegistry not set");
        GameRegistry registry = GameRegistry(gameRegistry);
        bool verified = registry.verifyGameResult(result);
        require(verified, "Game result verification failed");

        // 4. 更新分数和存储游戏结果
        scores[msg.sender] = result.score;
        gameResults[msg.sender] = result;

        emit ScoreSubmitted(msg.sender, result.score);
    }
    
    /// @notice 比赛创建者/裁判设置比赛胜者
    /// @dev 支持设置多个胜者（例如，设置前三名），按顺序对应排名 1, 2, 3...
    /// @param _winners 获胜者的地址列表，按排名顺序 (如: [1st_addr, 2nd_addr, 3rd_addr])
    function setWinners(address[] calldata _winners) external onlyRole(CREATOR_ROLE) { // <--- 更新函数名和参数
        require(status == Types.GameStatus.Ongoing, "Game not ongoing");
        
        // 1. 检查所有胜者是否已报名
        for (uint i = 0; i < _winners.length; i++) {
            require(isJoined[_winners[i]], "There is winner not join");
        }
        
        // 2. 更新状态
        winners = _winners;
        status = Types.GameStatus.Ended;

        emit WinnersSet(_winners);
    }

    /// @notice 计算并记录奖金到 prizeToClaimsAmount 映射中
    function distributePrize() external onlyRole(CREATOR_ROLE) {
        require(status == Types.GameStatus.Ended, "Game not ended");
        require(winners.length > 0, "No winners set");
        require(prizePool > 0, "Prize pool is empty");
        
        uint totalPrizePool = prizePool;
        prizePool = 0; // 清空奖池

        UserLevelManager levelMgr = UserLevelManager(levelManager);

        // ... (WinnerTakesAll 逻辑)
        if (distributionType == Types.PrizeDistributionType.WinnerTakesAll) {
            // 赢者通吃：所有奖金给第一名 (winners[0])
            prizeToClaimsAmount[winners[0]] += totalPrizePool;

            // 给第一名额外经验奖励
            if (levelManager != address(0)) {
                levelMgr.addExp(winners[0], 20 * 10**18); // 20 BLZ = 20 经验
            }

        } else if (distributionType == Types.PrizeDistributionType.AverageSplit) {
            // 平均分配：奖池平均分配给所有**参赛者** (players)
            uint playerLength = players.length;
            uint averageAmount = totalPrizePool / playerLength;
            uint remainder = totalPrizePool % playerLength; 
            
            for (uint i = 0; i < playerLength; i++) {
                uint amount = averageAmount;
                prizeToClaimsAmount[players[i].player] += amount; // 记录可领取金额
            }

            require(IERC20(prizeToken).transfer(creator, remainder), "Refund failed");

        } else if (distributionType == Types.PrizeDistributionType.CustomRanked) {
            
            // 0. 安全检查：确保获奖人数不超过配置的奖励数量
            require(winners.length <= rankPrizes.length, "Winners list exceeds rank prize configuration");

            uint totalBps = 0;
            
            // 1. 检查 BPS 总和
            for (uint i = 0; i < winners.length; i++) { 

                uint bps = rankPrizes[i]; 
                
                require(bps > 0, "Missing prize config for rank");
                totalBps += bps;
            }
            
            // 此检查确保实际分配的 BPS 没有问题 (initialize 已做过完整检查，此处仅为运行时保险)
            require(totalBps <= 10000, "Prize BPS exceeds 100%"); 

            // 2. 按排名计算并记录奖金
            // 循环 i 从 0 到 winners.length - 1 (代表数组索引 0, 1, 2...)
            for (uint i = 0; i < winners.length; i++) {
                // 索引 i 对应 rankPrizes[i]
                uint bps = rankPrizes[i]; // <-- 修正：使用 i 作为索引
                uint prizeAmount = (totalPrizePool * bps) / 10000;
                
                prizeToClaimsAmount[winners[i]] += prizeAmount; // 记录可领取金额

                // 给排名前3的玩家额外经验奖励
                if (levelManager != address(0)) {
                    if (i == 0) {
                        levelMgr.addExp(winners[i], 20 * 10**18); // 第一名：20 经验
                    } else if (i == 1) {
                        levelMgr.addExp(winners[i], 10 * 10**18); // 第二名：10 经验
                    } else if (i == 2) {
                        levelMgr.addExp(winners[i], 5 * 10**18); // 第三名：5 经验
                    }
                }
            }
        }
        
        status = Types.GameStatus.PrizeDistributed;
        // 不再 emit PrizeDistributed 事件，直到实际转账发生
    }

    /// @notice 玩家主动领取奖金
    function claimPrize() external {
        uint amount = prizeToClaimsAmount[msg.sender];
        require(amount > 0, "No prize to claim");

        // 1. 清零奖金记录（重要：必须在转账前清零，防止重入攻击）
        prizeToClaimsAmount[msg.sender] = 0;

        // 2. 执行转账
        // 使用 IERC20.transfer 将代币从合约转给调用者
        require(IERC20(prizeToken).transfer(msg.sender, amount), "Transfer failed");
        
        // 3. 触发事件
        emit PrizeDistributed(msg.sender, amount);
    }

    /// @notice 玩家主动领取退款
    function claimRefund() external {
        require(status == Types.GameStatus.Canceled, "Game not canceled");
        uint amount = playerEntryFees[msg.sender];
        require(amount > 0, "No prize to claim");

        playerEntryFees[msg.sender] = 0;

        // 2. 执行转账
        // 使用 IERC20.transfer 将代币从合约转给调用者
        require(IERC20(feeToken).transfer(msg.sender, amount), "Transfer failed");
        
        // 3. 触发事件
        emit FeeRefund(msg.sender, amount);
    }

    /// @dev 内部安全转账辅助函数 (已无用，但如果保留则需要修正)
    // 注意：在拉取模式下，此函数不再被 distributePrize 调用，但如果保留，也应修正。
    function _safeTransferPrize(address recipient, uint amount) internal {
        if (amount > 0) {
            require(IERC20(prizeToken).transfer(recipient, amount), "Transfer failed"); // [cite: 89]
            emit PrizeDistributed(recipient, amount);
        }
    }
    
    // 添加查看某个玩家成绩的函数
    function getPlayerScore(address player) external view returns (uint) {
        return scores[player];
    }

    function getGameData() external view returns (Types.GameData memory) {
        Types.GameData memory data;
        data.creator = creator;
        data.title = title;
        data.description = description;
        data.status = status;
        data.gameType = gameType; // 新增：包含游戏类型

        data.maxPlayers = maxPlayers;
        data.playerCount = players.length;
        
        data.registrationEndTime = registrationEndTime;
        data.gameStartTime = gameStartTime;
        
        data.entryFee = entryFee;
        data.feeToken = feeToken;
        
        data.prizePool = prizePool;
        data.prizeToken = prizeToken;

        return data;
    }

    /// @notice 获取玩家的游戏结果
    function getPlayerGameResult(address player) external view returns (Types.GameResult memory) {
        return gameResults[player];
    }

}