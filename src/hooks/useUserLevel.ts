"use client";

import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  USER_LEVEL_MANAGER_ABI,
} from "@/lib/contracts";
import { getContractAddresses } from "@/lib/chainConfig";

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
  const addresses = getContractAddresses(31337); // 默认使用本地网络

  const { data: userData, isLoading, error, refetch } = useReadContract({
    address: addresses.USER_LEVEL_MANAGER as `0x${string}`,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getUserData",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
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
  const addresses = getContractAddresses(31337);

  const { data: expNeeded } = useReadContract({
    address: addresses.USER_LEVEL_MANAGER as `0x${string}`,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getExpForLevel",
    args: [BigInt(level)],
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
  const addresses = getContractAddresses(31337);

  const { data: hasAchievement } = useReadContract({
    address: addresses.USER_LEVEL_MANAGER as `0x${string}`,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "hasAchievement",
    args: address ? [address, BigInt(achievementId)] : undefined,
    query: {
      enabled: !!address,
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
  const addresses = getContractAddresses(31337);

  const { data: achievement } = useReadContract({
    address: addresses.USER_LEVEL_MANAGER as `0x${string}`,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getAchievement",
    args: [BigInt(achievementId)],
  });

  return {
    achievement,
  };
}

/**
 * 获取 UserLevelManager 合约的代币余额
 */
export function useLevelManagerTokenBalance() {
  const addresses = getContractAddresses(31337);

  const { data: balance } = useReadContract({
    address: addresses.USER_LEVEL_MANAGER as `0x${string}`,
    abi: USER_LEVEL_MANAGER_ABI,
    functionName: "getTokenBalance",
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
