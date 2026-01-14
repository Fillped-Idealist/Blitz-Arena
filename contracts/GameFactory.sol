// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
// import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Types} from "./Types.sol"; // 引入公共类型库
import {GameInstance} from "./GameInstance.sol";
import {UserLevelManager} from "./UserLevelManager.sol";


contract GameFactory is AccessControl {

    // immutable
    address immutable BLZ_TOKEN_ADDRESS;
    address immutable LEVEL_MANAGER_ADDRESS;

    address[] public allGames;   // 所有比赛实例

    mapping(address => address[]) public gamesByCreator; // 某人创建的比赛

    event GameCreated(address indexed game, address indexed creator);
    event FeesWithdrawn(address indexed token, address indexed recipient, uint amount);

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    mapping(address => uint) public feeBalances; // 管理多代币费用的映射：代币地址 => 累积的费用金额


    // 构造函数：设置初始 Owner
    constructor(address blitzTokenAddress, address levelManagerAddress) {
        BLZ_TOKEN_ADDRESS = blitzTokenAddress;
        LEVEL_MANAGER_ADDRESS = levelManagerAddress;
        // 设置合约部署者为 Owner 和 DEFAULT_ADMIN_ROLE
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, msg.sender);
        _setRoleAdmin(OWNER_ROLE, DEFAULT_ADMIN_ROLE);
    }
    

    function createGame(Types.GameConfig memory config) external returns (address gameInstance) {
        // 1. 计算费用和总转账金额
        uint totalPrizePool = config.prizePool;
        // 5% 费用计算 (10000 基点中的 500)
        uint creatorFee = (totalPrizePool * 500) / 10000; 
        uint totalTransferAmount = totalPrizePool + creatorFee;

        // 2. 检查创建者是否已预授权 GameFactory 支付总金额
        require(
            IERC20(config.prizeTokenAddress).allowance(msg.sender, address(this)) >= totalTransferAmount,
            "Factory not approved for prize/fee token transfer"
        );

        // 3. 将总金额 (奖池 + 费用) 从创建者转入 Factory 合约
        // 注意：这里的 address(this) 是 GameFactory 合约地址
        require(IERC20(config.prizeTokenAddress).transferFrom(
            msg.sender, 
            address(this), 
            totalTransferAmount
        ), "Transfer failed");

        // 4. 部署新比赛实例 (全量部署模式)
        GameInstance newGame = new GameInstance();
        gameInstance = address(newGame);

        // 5. 初始化比赛实例
        config.feeTokenAddress = BLZ_TOKEN_ADDRESS;
        newGame.initialize(config, msg.sender, LEVEL_MANAGER_ADDRESS);
        
        // 6. 将初始奖池金额转入新部署的 GameInstance 合约
        // 费用 (creatorFee) 留在 Factory 合约中，等待 Factory Owner 提取。
        if (totalPrizePool > 0) {
            // Factory 将奖池部分转给新的 GameInstance 合约
            require(IERC20(config.prizeTokenAddress).transfer(gameInstance, totalPrizePool), "Transfer failed");
        }
        
        
        // 7. 记录
        if (creatorFee > 0) {
            feeBalances[config.prizeTokenAddress] += creatorFee; // <--- 关键：记录费用
        }
        allGames.push(gameInstance);
        gamesByCreator[msg.sender].push(gameInstance);

        // 给创建者增加经验和解锁成就（通过 UserLevelManager）
        UserLevelManager levelManager = UserLevelManager(LEVEL_MANAGER_ADDRESS);
        // 创建比赛奖励：5 BLZ 代币 = 5 经验
        levelManager.addExp(msg.sender, 5 * 10**18);

        emit GameCreated(gameInstance, msg.sender);
        
    }

    /// @notice 只有 Owner 才能调用，提取 Factory 合约中所有累积的代币费用
    function withdrawFees(address tokenAddress) external onlyRole(OWNER_ROLE) { // <--- 新增
        uint amount = feeBalances[tokenAddress];
        require(amount > 0, "No fees to withdraw for this token");

        // 1. 清零费用记录（重要：防止重入攻击）
        feeBalances[tokenAddress] = 0;

        // 2. 执行代币转账
        // 从 Factory 合约转账给调用者 (Owner)
        require(IERC20(tokenAddress).transfer(msg.sender, amount), "Transfer failed"); 

        emit FeesWithdrawn(tokenAddress, msg.sender, amount);
    }



    /// @notice 返回系统中所有比赛
    function getAllGames() external view returns (address[] memory) {
        return allGames;
    }

    /// @notice 返回系统中部分比赛
    /// @param begin 起始索引 (基于 0)
    /// @param count 要返回的比赛数量
    function getPartofGames(uint begin, uint count) 
        external 
        view 
        returns (address[] memory) 
    {
        // 1. 检查起始索引是否越界
        require(begin < allGames.length, "Invalid start index (out of bounds)");

        // 2. 计算实际的结束索引
        // 结束索引应该是 min(begin + count, allGames.length)
        uint end = begin + count;

        // 如果 end 超过了数组总长度，就设置为总长度
        if (end > allGames.length) {
            end = allGames.length;
        }

        // 3. 计算要返回的实际数量
        uint actualCount = end - begin;

        // 4. 创建结果数组并复制数据
        address[] memory result = new address[](actualCount);
        
        for (uint i = 0; i < actualCount; i++) {
            // 从 allGames[begin] 开始复制
            result[i] = allGames[begin + i];
        }

        return result;
    }
    
    /// @notice 返回比赛总数，方便链下应用计算分页总页数
    function getTotalGames() external view returns (uint) {
        return allGames.length;
    }

    
}