"use client";

import { useAccount, useChainId } from "wagmi";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  USER_LEVEL_MANAGER_ABI,
} from "@/lib/contracts";
import { getContractAddresses, isSupportedChain } from "@/lib/chainConfig";

/**
 * 用户等级数据接口
 */
export interface UserLevelData {
  totalExp: bigint;
  currentLevel: bigint;
  expForNextLevel: bigint;
}

/**
 * 获取用户等级数据
 */
export function useUserLevel() {
  const { address } = useAccount();
  const chainId = useChainId();

  // 检查网络是否支持
  const supported = isSupportedChain(chainId);
  if (!supported) {
    console.warn(`Chain ID ${chainId} is not supported`);
  }

  // 只在支持的网络中获取合约地址
  const addresses = supported ? getContractAddresses(chainId) : null;

  const { data: userData, isLoading, error, refetch } = useReadContract({
    address: addresses?.USER_LEVEL_MANAGER as `0x${string}` | undefined,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getUserData",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && supported && !!addresses,
    },
  });

  return {
    userData: userData as UserLevelData | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 获取特定等级所需的经验
 */
export function useExpForLevel(level: number) {
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);
  const addresses = supported ? getContractAddresses(chainId) : null;

  const { data: expNeeded } = useReadContract({
    address: addresses?.USER_LEVEL_MANAGER as `0x${string}` | undefined,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getExpForLevel",
    args: [BigInt(level)],
    query: {
      enabled: supported && !!addresses,
    },
  });

  return {
    expNeeded: expNeeded as bigint | undefined,
  };
}

/**
 * 检查用户是否解锁了成就
 */
export function useHasAchievement(achievementId: number) {
  const { address } = useAccount();
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);
  const addresses = supported ? getContractAddresses(chainId) : null;

  const { data: hasAchievement } = useReadContract({
    address: addresses?.USER_LEVEL_MANAGER as `0x${string}` | undefined,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "hasAchievement",
    args: address ? [address, BigInt(achievementId)] : undefined,
    query: {
      enabled: !!address && supported && !!addresses,
    },
  });

  return {
    hasAchievement: hasAchievement as boolean | undefined,
  };
}

/**
 * 获取成就信息
 */
export function useAchievement(achievementId: number) {
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);
  const addresses = supported ? getContractAddresses(chainId) : null;

  const { data: achievement } = useReadContract({
    address: addresses?.USER_LEVEL_MANAGER as `0x${string}` | undefined,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getAchievement",
    args: [BigInt(achievementId)],
    query: {
      enabled: supported && !!addresses,
    },
  });

  return {
    achievement,
  };
}

/**
 * 获取 UserLevelManager 合约的代币余额
 */
export function useLevelManagerTokenBalance() {
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);
  const addresses = supported ? getContractAddresses(chainId) : null;

  const { data: balance } = useReadContract({
    address: addresses?.USER_LEVEL_MANAGER as `0x${string}` | undefined,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getTokenBalance",
    query: {
      enabled: supported && !!addresses,
    },
  });

  return {
    balance: balance as bigint | undefined,
    formattedBalance: balance ? Number(formatUnits(balance, 18)).toFixed(2) : "0.00",
  };
}

/**
 * 格式化用户等级数据以便显示
 */
export function formatUserLevelData(userData?: UserLevelData) {
  if (!userData) {
    return {
      level: 1,
      experience: 0,
      totalExp: 0,
      expForNextLevel: 100,
      progress: 0,
    };
  }

  // 检查所有字段是否存在，如果不存在则使用默认值
  if (
    userData.totalExp === undefined ||
    userData.totalExp === null ||
    userData.currentLevel === undefined ||
    userData.currentLevel === null ||
    userData.expForNextLevel === undefined ||
    userData.expForNextLevel === null
  ) {
    return {
      level: 1,
      experience: 0,
      totalExp: 0,
      expForNextLevel: 100,
      progress: 0,
    };
  }

  const level = Number(userData.currentLevel);
  const totalExp = Number(formatUnits(userData.totalExp, 18));
  const expForNextLevel = Number(formatUnits(userData.expForNextLevel, 18));

  // 计算当前等级的经验进度
  // 简化处理：使用 expForNextLevel 作为目标值，totalExp 作为当前值
  const progress = expForNextLevel > 0 ? Math.min((totalExp % expForNextLevel) / expForNextLevel * 100, 100) : 0;

  return {
    level,
    experience: Math.floor(totalExp % expForNextLevel),
    totalExp,
    expForNextLevel,
    progress,
  };
}
