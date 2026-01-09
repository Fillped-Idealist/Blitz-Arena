"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

// 合约 ABI (简化版，仅包含关键函数)
const GAME_FACTORY_ABI = [
  "function createGame((string title, string description, address feeTokenAddress, uint entryFee, uint minPlayers, uint maxPlayers, uint registrationEndTime, uint gameStartTime, address prizeTokenAddress, uint prizePool, uint8 distributionType, uint[] rankPrizes)) external returns (address)",
  "function getAllGames() external view returns (address[])",
  "function getPartofGames(uint begin, uint count) external view returns (address[])",
  "function getTotalGames() external view returns (uint)"
];

const GAME_INSTANCE_ABI = [
  "function joinGame() external",
  "function submitScore(uint score) external",
  "function startGame() external",
  "function endGame() external",
  "function setWinners(address[] memory _winners) external",
  "function distributePrize() external",
  "function claimPrize() external",
  "function cancelGame() external",
  "function cancelRegistration() external",
  "function claimRefund() external",
  "function getGameData() external view returns ((address creator, string title, string description, uint8 status, uint maxPlayers, uint playerCount, uint registrationEndTime, uint gameStartTime, uint entryFee, address feeToken, uint prizePool, address prizeToken))",
  "function getPlayers() external view returns ((address player, uint score)[])"
];

const MOCK_ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];

// 合约地址 (从部署文件读取)
const GAME_FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const BLZ_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const PRIZE_TOKEN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// 游戏状态枚举
const GameStatus = {
  0: "已创建",
  1: "进行中",
  2: "已结束",
  3: "奖金已分发",
  4: "已取消"
};

// 奖励分配方式枚举
const PrizeDistributionType = {
  0: "胜者全得",
  1: "平均分配",
  2: "自定义排名"
};

export default function Home() {
  const [account, setAccount] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "list">("list");

  // 创建游戏表单状态
  const [gameForm, setGameForm] = useState({
    title: "",
    description: "",
    entryFee: "",
    minPlayers: "",
    maxPlayers: "",
    prizePool: "",
    distributionType: "0",
    registrationDuration: "86400", // 默认 24 小时
    gameDuration: "3600" // 默认 1 小时
  });

  // 连接钱包
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("请安装 MetaMask 钱包！");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setMessage("钱包连接成功！");
      setTimeout(() => setMessage(""), 3000);

      // 加载游戏列表
      loadGames();
    } catch (error: any) {
      setMessage(`连接失败: ${error.message}`);
    }
  };

  // 加载游戏列表
  const loadGames = async () => {
    try {
      if (!provider) return;

      const factory = new ethers.Contract(GAME_FACTORY_ADDRESS, GAME_FACTORY_ABI, provider);
      const gameAddresses = await factory.getAllGames();

      const gameDataPromises = gameAddresses.map(async (address: string) => {
        const game = new ethers.Contract(address, GAME_INSTANCE_ABI, provider);
        const data = await game.getGameData();
        return {
          address,
          ...data,
          statusName: GameStatus[data.status as keyof typeof GameStatus]
        };
      });

      const gamesData = await Promise.all(gameDataPromises);
      setGames(gamesData.reverse()); // 最新的在前面
    } catch (error: any) {
      console.error("加载游戏失败:", error);
    }
  };

  // 创建游戏
  const createGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("正在创建游戏...");

    try {
      if (!signer) {
        throw new Error("请先连接钱包");
      }

      const factory = new ethers.Contract(GAME_FACTORY_ADDRESS, GAME_FACTORY_ABI, signer);

      // 计算 Unix 时间戳
      const now = Math.floor(Date.now() / 1000);
      const registrationEndTime = now + parseInt(gameForm.registrationDuration);
      const gameStartTime = registrationEndTime + parseInt(gameForm.gameDuration);

      // 授权 Prize Token 给 Factory
      const prizeToken = new ethers.Contract(PRIZE_TOKEN_ADDRESS, MOCK_ERC20_ABI, signer);
      const prizePoolAmount = ethers.parseEther(gameForm.prizePool);
      const totalAmount = prizePoolAmount + (prizePoolAmount * BigInt(500) / BigInt(10000)); // 奖池 + 5% 手续费

      setMessage("正在授权代币...");
      const approveTx = await prizeToken.approve(GAME_FACTORY_ADDRESS, totalAmount);
      await approveTx.wait();

      setMessage("正在创建游戏实例...");
      const tx = await factory.createGame({
        title: gameForm.title,
        description: gameForm.description,
        feeTokenAddress: BLZ_TOKEN_ADDRESS,
        entryFee: ethers.parseEther(gameForm.entryFee || "0"),
        minPlayers: parseInt(gameForm.minPlayers),
        maxPlayers: parseInt(gameForm.maxPlayers),
        registrationEndTime,
        gameStartTime,
        prizeTokenAddress: PRIZE_TOKEN_ADDRESS,
        prizePool: prizePoolAmount,
        distributionType: parseInt(gameForm.distributionType),
        rankPrizes: []
      });

      await tx.wait();
      setMessage("游戏创建成功！");
      setActiveTab("list");
      loadGames();
    } catch (error: any) {
      setMessage(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 参加游戏
  const joinGame = async (gameAddress: string) => {
    try {
      if (!signer) {
        throw new Error("请先连接钱包");
      }

      const game = new ethers.Contract(gameAddress, GAME_INSTANCE_ABI, signer);
      setMessage("正在报名...");

      const tx = await game.joinGame();
      await tx.wait();

      setMessage("报名成功！");
      loadGames();
    } catch (error: any) {
      setMessage(`报名失败: ${error.message}`);
    }
  };

  // 铸造测试代币
  const mintTokens = async () => {
    try {
      if (!signer) {
        throw new Error("请先连接钱包");
      }

      const prizeToken = new ethers.Contract(PRIZE_TOKEN_ADDRESS, MOCK_ERC20_ABI, signer);
      const tx = await prizeToken.mint(account, ethers.parseEther("10000"));
      await tx.wait();

      const blzToken = new ethers.Contract(BLZ_TOKEN_ADDRESS, MOCK_ERC20_ABI, signer);
      const tx2 = await blzToken.mint(account, ethers.parseEther("10000"));
      await tx2.wait();

      setMessage("代币铸造成功！");
    } catch (error: any) {
      setMessage(`铸造失败: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* 头部 */}
      <header className="border-b border-gray-700 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            游戏竞技平台
          </h1>
          <div className="flex gap-4 items-center">
            {account ? (
              <>
                <span className="text-sm text-gray-400">{account.slice(0, 6)}...{account.slice(-4)}</span>
                <button
                  onClick={mintTokens}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                >
                  铸造测试代币
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                连接钱包
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 消息提示 */}
      {message && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-3 text-sm">
            {message}
          </div>
        </div>
      )}

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 标签切换 */}
        {account && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              游戏列表
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "create"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              创建游戏
            </button>
          </div>
        )}

        {/* 未连接状态 */}
        {!account && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-3xl font-bold mb-4">欢迎来到游戏竞技平台</h2>
            <p className="text-gray-400 mb-8">连接钱包开始参与游戏竞技</p>
          </div>
        )}

        {/* 游戏列表 */}
        {account && activeTab === "list" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">游戏列表</h2>
            {games.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无游戏</div>
            ) : (
              games.map((game) => (
                <div
                  key={game.address}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{game.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                          状态: {game.statusName}
                        </span>
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                          玩家: {game.playerCount}/{game.maxPlayers}
                        </span>
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded">
                          奖池: {ethers.formatEther(game.prizePool)} 代币
                        </span>
                        <span className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded">
                          报名费: {ethers.formatEther(game.entryFee)} 代币
                        </span>
                      </div>
                    </div>
                  </div>
                  {game.status === 0 && (
                    <button
                      onClick={() => joinGame(game.address)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      参加游戏
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 创建游戏表单 */}
        {account && activeTab === "create" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">创建新游戏</h2>
            <form onSubmit={createGame} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">游戏标题</label>
                <input
                  type="text"
                  required
                  value={gameForm.title}
                  onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入游戏标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">游戏描述</label>
                <textarea
                  required
                  value={gameForm.description}
                  onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="输入游戏描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">报名费 (代币)</label>
                  <input
                    type="text"
                    required
                    value={gameForm.entryFee}
                    onChange={(e) => setGameForm({ ...gameForm, entryFee: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">奖池 (代币)</label>
                  <input
                    type="text"
                    required
                    value={gameForm.prizePool}
                    onChange={(e) => setGameForm({ ...gameForm, prizePool: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">最小玩家数</label>
                  <input
                    type="number"
                    required
                    min="2"
                    value={gameForm.minPlayers}
                    onChange={(e) => setGameForm({ ...gameForm, minPlayers: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">最大玩家数</label>
                  <input
                    type="number"
                    required
                    min="2"
                    value={gameForm.maxPlayers}
                    onChange={(e) => setGameForm({ ...gameForm, maxPlayers: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">奖励分配方式</label>
                <select
                  value={gameForm.distributionType}
                  onChange={(e) => setGameForm({ ...gameForm, distributionType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">胜者全得</option>
                  <option value="1">平均分配</option>
                  <option value="2">自定义排名</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">报名时长 (秒)</label>
                  <input
                    type="number"
                    required
                    value={gameForm.registrationDuration}
                    onChange={(e) => setGameForm({ ...gameForm, registrationDuration: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="86400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">游戏时长 (秒)</label>
                  <input
                    type="number"
                    required
                    value={gameForm.gameDuration}
                    onChange={(e) => setGameForm({ ...gameForm, gameDuration: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "创建中..." : "创建游戏"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
