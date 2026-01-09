'use client';

import { useWriteContract, useReadContract } from 'wagmi';
import { toast } from 'sonner';

// 游戏类型枚举（与合约保持一致）
export enum GameType {
  None = 0,
  NumberGuess = 1,
  RockPaperScissors = 2,
  QuickClick = 3
}

// 游戏结果接口
export interface GameResult {
  gameType: number;
  playerAddress: string;
  score: number;
  timestamp: number;
  gameHash: string;
  metadata: number[];
}

// 计算游戏哈希（与合约的keccak256逻辑一致）
export function computeGameHash(result: GameResult): string {
  // 在实际实现中，这里应该使用ethers.js或viem的keccak256
  // 这里简化实现，返回十六进制字符串
  const data = `${result.gameType}-${result.playerAddress}-${result.score}-${result.timestamp}-${result.metadata.join(',')}`;

  // 使用Web Crypto API计算SHA-256（实际部署时应使用ethers/viem的keccak256）
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // 在浏览器环境中
  if (typeof window !== 'undefined' && 'crypto' in window) {
    return window.crypto.subtle.digest('SHA-256', dataBuffer).then(buffer => {
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return '0x' + hashHex;
    });
  }

  // 服务端环境或降级方案
  return '0x' + Array.from(dataBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 异步版本的计算哈希函数
export async function computeGameHashAsync(result: GameResult): Promise<string> {
  const data = `${result.gameType}-${result.playerAddress}-${result.score}-${result.timestamp}-${result.metadata.join(',')}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  if (typeof window !== 'undefined' && 'crypto' in window) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 降级方案：简单的字符串哈希
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * 提交游戏结果到链上的Hook
 * @param gameInstanceAddress 游戏实例合约地址
 */
export function useSubmitGameResult(gameInstanceAddress: `0x${string}`) {
  const { writeContract, isPending, isSuccess, error } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('游戏成绩已成功提交到链上！');
      },
      onError: (error) => {
        console.error('Failed to submit game result:', error);
        toast.error('提交游戏成绩失败，请重试');
      }
    }
  });

  const submitGameResult = async (result: GameResult) => {
    try {
      // 计算正确的哈希值
      const gameHash = await computeGameHashAsync(result);

      // 调用GameInstance合约的submitGameResult函数
      // 注意：需要确保ABI包含了该函数
      writeContract({
        address: gameInstanceAddress,
        abi: [
          {
            "inputs": [
              {
                "components": [
                  {"internalType": "enum Types.GameType", "name": "gameType", "type": "uint8"},
                  {"internalType": "address", "name": "player", "type": "address"},
                  {"internalType": "uint256", "name": "score", "type": "uint256"},
                  {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                  {"internalType": "bytes32", "name": "gameHash", "type": "bytes32"},
                  {"internalType": "uint256[]", "name": "metadata", "type": "uint256[]"}
                ],
                "internalType": "struct Types.GameResult",
                "name": "result",
                "type": "tuple"
              }
            ],
            "name": "submitGameResult",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'submitGameResult',
        args: [
          {
            gameType: result.gameType,
            player: result.playerAddress as `0x${string}`,
            score: BigInt(result.score),
            timestamp: BigInt(result.timestamp),
            gameHash: gameHash as `0x${string}`,
            metadata: result.metadata.map(m => BigInt(m))
          }
        ]
      });
    } catch (error) {
      console.error('Error in submitGameResult:', error);
      throw error;
    }
  };

  return {
    submitGameResult,
    isPending,
    isSuccess,
    error
  };
}

/**
 * 获取游戏结果的Hook
 * @param gameInstanceAddress 游戏实例合约地址
 * @param playerAddress 玩家地址
 */
export function useGetPlayerGameResult(gameInstanceAddress: `0x${string}`, playerAddress: `0x${string}`) {
  return useReadContract({
    address: gameInstanceAddress,
    abi: [
      {
        "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
        "name": "getPlayerGameResult",
        "outputs": [
          {
            "components": [
              {"internalType": "enum Types.GameType", "name": "gameType", "type": "uint8"},
              {"internalType": "address", "name": "player", "type": "address"},
              {"internalType": "uint256", "name": "score", "type": "uint256"},
              {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
              {"internalType": "bytes32", "name": "gameHash", "type": "bytes32"},
              {"internalType": "uint256[]", "name": "metadata", "type": "uint256[]"}
            ],
            "internalType": "struct Types.GameResult",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getPlayerGameResult',
    args: [playerAddress],
    query: {
      enabled: !!gameInstanceAddress && !!playerAddress
    }
  });
}

/**
 * 获取游戏信息的Hook
 * @param gameInstanceAddress 游戏实例合约地址
 */
export function useGetGameData(gameInstanceAddress: `0x${string}`) {
  return useReadContract({
    address: gameInstanceAddress,
    abi: [
      {
        "inputs": [],
        "name": "getGameData",
        "outputs": [
          {
            "components": [
              {"internalType": "address", "name": "creator", "type": "address"},
              {"internalType": "string", "name": "title", "type": "string"},
              {"internalType": "string", "name": "description", "type": "string"},
              {"internalType": "enum Types.GameStatus", "name": "status", "type": "uint8"},
              {"internalType": "enum Types.GameType", "name": "gameType", "type": "uint8"},
              {"internalType": "uint256", "name": "maxPlayers", "type": "uint256"},
              {"internalType": "uint256", "name": "playerCount", "type": "uint256"},
              {"internalType": "uint256", "name": "registrationEndTime", "type": "uint256"},
              {"internalType": "uint256", "name": "gameStartTime", "type": "uint256"},
              {"internalType": "address", "name": "feeToken", "type": "address"},
              {"internalType": "uint256", "name": "entryFee", "type": "uint256"},
              {"internalType": "address", "name": "prizeToken", "type": "address"},
              {"internalType": "uint256", "name": "prizePool", "type": "uint256"}
            ],
            "internalType": "struct Types.GameData",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getGameData',
    query: {
      enabled: !!gameInstanceAddress
    }
  });
}
