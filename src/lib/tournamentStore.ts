'use client';

import { toast } from 'sonner';

// 交易类型
export type TransactionType =
  | 'join_fee'         // 报名费支付
  | 'prize_payout'     // 奖金发放
  | 'refund'           // 退款
  | 'platform_fee'     // 平台手续费
  | 'cancel_refund';   // 取消比赛退款

// 交易记录
export interface Transaction {
  id: string;
  type: TransactionType;
  fromAddress: string | null; // null 表示平台发放
  toAddress: string | null;   // null 表示平台收取
  amount: string;              // 代币数量
  timestamp: number;
  tournamentId?: string;       // 关联的比赛ID
  description: string;
}

// 比赛数据类型
export interface Tournament {
  id: string;
  address: string;
  title: string;
  description: string;
  gameType: string; // "1", "2", "3"
  gameTypeLabel: string;
  gameTypeIcon: string;
  prize: string;
  entryFee: string;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  status: 'Open' | 'Full' | 'Ongoing' | 'Ended' | 'Canceled';
  statusColor: string;
  startTimeOffset: number; // 距离现在多少分钟开始
  duration: number; // 比赛持续时间（分钟）
  creatorAddress: string;
  createdAt: number;
  distributionType: string; // "0"=Winner Takes All, "1"=Average Split, "2"=Top 3 Ranked
  participants: string[]; // 参与者地址列表
  results: {
    playerAddress: string;
    score: number;
    timestamp: number;
  }[];
}

// 初始示例数据
const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    address: '0x1234567890abcdef',
    title: 'Championship League',
    description: 'The ultimate battle royale competition with massive prizes',
    gameType: '1',
    gameTypeLabel: 'Number Guess',
    gameTypeIcon: '🔢',
    prize: '10000',
    entryFee: '100',
    minPlayers: 2,
    maxPlayers: 128,
    currentPlayers: 96,
    status: 'Open',
    statusColor: 'bg-blue-500',
    startTimeOffset: 60, // 1 hour from now
    duration: 1440, // 24 hours
    creatorAddress: '0xcreator',
    createdAt: Date.now(),
    distributionType: '0', // Winner Takes All
    participants: [],
    results: []
  },
  {
    id: '2',
    address: '0xabcdef1234567890',
    title: 'Weekly Speed Challenge',
    description: 'Test your reflexes in this fast-paced tournament',
    gameType: '2',
    gameTypeLabel: 'Rock Paper Scissors',
    gameTypeIcon: '✊✋✌️',
    prize: '5000',
    entryFee: '50',
    minPlayers: 2,
    maxPlayers: 64,
    currentPlayers: 64,
    status: 'Full',
    statusColor: 'bg-red-500',
    startTimeOffset: 30, // 30 minutes from now
    duration: 720, // 12 hours
    creatorAddress: '0xcreator',
    createdAt: Date.now(),
    distributionType: '1', // Average Split
    participants: [],
    results: []
  },
  {
    id: '3',
    address: '0x567890abcdef1234',
    title: 'Pro Strategy Series',
    description: 'Strategic gameplay competition for serious players',
    gameType: '3',
    gameTypeLabel: 'Quick Click',
    gameTypeIcon: '🎯',
    prize: '25000',
    entryFee: '500',
    minPlayers: 2,
    maxPlayers: 32,
    currentPlayers: 28,
    status: 'Open',
    statusColor: 'bg-blue-500',
    startTimeOffset: 1440, // 24 hours from now
    duration: 2880, // 48 hours
    creatorAddress: '0xcreator',
    createdAt: Date.now(),
    distributionType: '2', // Top 3 Ranked
    participants: [],
    results: []
  },
  {
    id: '4',
    address: '0x90abcdef12345678',
    title: 'Rookie Cup',
    description: 'Beginner-friendly tournament with low entry barriers',
    gameType: '1',
    gameTypeLabel: 'Number Guess',
    gameTypeIcon: '🔢',
    prize: '1000',
    entryFee: '10',
    minPlayers: 2,
    maxPlayers: 50,
    currentPlayers: 32,
    status: 'Open',
    statusColor: 'bg-blue-500',
    startTimeOffset: 120, // 2 hours from now
    duration: 480, // 8 hours
    creatorAddress: '0xcreator',
    createdAt: Date.now(),
    distributionType: '0', // Winner Takes All
    participants: [],
    results: []
  }
];

// 游戏类型映射
const GAME_TYPES = {
  '1': { label: 'Number Guess', icon: '🔢' },
  '2': { label: 'Rock Paper Scissors', icon: '✊✋✌️' },
  '3': { label: 'Quick Click', icon: '🎯' },
  '4': { label: 'Roguelike Survival', icon: '⚔️' },
  '5': { label: 'Infinite Match', icon: '🧩' }
};

// 更新比赛状态（根据时间）
function updateTournamentStatus(tournament: Tournament): Tournament {
  const now = Date.now();
  const startTime = tournament.createdAt + tournament.startTimeOffset * 60 * 1000;
  const endTime = startTime + tournament.duration * 60 * 1000;

  // 已取消的比赛不更新状态
  if (tournament.status === 'Canceled') {
    return tournament;
  }

  // 比赛已结束
  if (now >= endTime) {
    if (tournament.status !== 'Ended') {
      tournament.status = 'Ended';
      tournament.statusColor = 'bg-gray-500';
    }
    return tournament;
  }

  // 比赛进行中 - 需要检查最小人数
  if (now >= startTime && tournament.status !== 'Ongoing' && tournament.status !== 'Ended') {
    // 检查是否达到最小人数
    if (tournament.currentPlayers < tournament.minPlayers) {
      // 人数不足，取消比赛
      tournament.status = 'Canceled';
      tournament.statusColor = 'bg-gray-500';
    } else {
      // 人数达标，比赛开始
      tournament.status = 'Ongoing';
      tournament.statusColor = 'bg-green-500';
    }
    return tournament;
  }

  // 比赛未开始但已满员
  if (tournament.currentPlayers >= tournament.maxPlayers && tournament.status !== 'Full' && tournament.status !== 'Ongoing' && tournament.status !== 'Ended') {
    tournament.status = 'Full';
    tournament.statusColor = 'bg-red-500';
    return tournament;
  }

  // 比赛开放报名
  if (tournament.status === 'Ended') {
    // 不应该执行到这里，但作为兜底
    tournament.status = 'Open';
    tournament.statusColor = 'bg-blue-500';
  }

  return tournament;
}

// 获取所有比赛
export function getAllTournaments(): Tournament[] {
  if (typeof window === 'undefined') return INITIAL_TOURNAMENTS;

  try {
    const stored = localStorage.getItem('tournaments');
    let tournaments: Tournament[];
    if (!stored) {
      localStorage.setItem('tournaments', JSON.stringify(INITIAL_TOURNAMENTS));
      tournaments = [...INITIAL_TOURNAMENTS];
    } else {
      tournaments = JSON.parse(stored);
    }

    // 更新所有比赛状态
    const updatedTournaments = tournaments.map(updateTournamentStatus);

    // 处理新取消的比赛退款
    tournaments.forEach((oldTournament, i) => {
      const newTournament = updatedTournaments[i];
      if (oldTournament.status !== 'Canceled' && newTournament.status === 'Canceled') {
        // 比赛被取消了，处理退款
        if (newTournament.participants.length > 0) {
          processCancelRefunds(newTournament.id);
          toast.error(`Tournament "${newTournament.title}" has been canceled due to insufficient players (${newTournament.currentPlayers}/${newTournament.minPlayers})`);
        }
      }
    });

    // 如果状态有变化，保存回localStorage
    const hasChanges = tournaments.some((t, i) => t.status !== updatedTournaments[i].status);
    if (hasChanges) {
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    }

    return updatedTournaments;
  } catch (error) {
    console.error('Failed to load tournaments:', error);
    return INITIAL_TOURNAMENTS;
  }
}

// 保存所有比赛
function saveTournaments(tournaments: Tournament[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
  } catch (error) {
    console.error('Failed to save tournaments:', error);
  }
}

// 创建新比赛
export function createTournament(data: {
  title: string;
  description: string;
  gameType: string;
  entryFee: string;
  prizePool: string;
  minPlayers: number;
  maxPlayers: number;
  distributionType: string;
  registrationDuration: number;
  gameDuration: number;
  creatorAddress: string;
  startImmediately?: boolean;
}): Tournament {
  const tournaments = getAllTournaments();

  const newTournament: Tournament = {
    id: Date.now().toString(),
    address: `0x${Math.random().toString(16).slice(2, 42)}`,
    title: data.title,
    description: data.description,
    gameType: data.gameType,
    gameTypeLabel: GAME_TYPES[data.gameType as keyof typeof GAME_TYPES].label,
    gameTypeIcon: GAME_TYPES[data.gameType as keyof typeof GAME_TYPES].icon,
    prize: data.prizePool,
    entryFee: data.entryFee,
    minPlayers: data.minPlayers,
    maxPlayers: data.maxPlayers,
    currentPlayers: 0,
    status: 'Open',
    statusColor: 'bg-blue-500',
    startTimeOffset: data.startImmediately ? 0 : data.registrationDuration,
    duration: data.gameDuration,
    creatorAddress: data.creatorAddress,
    createdAt: Date.now(),
    distributionType: data.distributionType,
    participants: [],
    results: []
  };

  const updatedTournaments = [newTournament, ...tournaments];
  saveTournaments(updatedTournaments);

  return newTournament;
}

// 加入比赛
export function joinTournament(tournamentId: string, playerAddress: string): boolean {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    toast.error('Tournament not found');
    return false;
  }

  if (tournament.status !== 'Open') {
    toast.error('Tournament is not open for registration');
    return false;
  }

  if (tournament.currentPlayers >= tournament.maxPlayers) {
    toast.error('Tournament is full');
    return false;
  }

  if (tournament.participants.includes(playerAddress)) {
    toast.error('You have already joined this tournament');
    return false;
  }

  // 记录报名费支付
  recordJoinFee(tournamentId, playerAddress, tournament.entryFee);

  tournament.currentPlayers += 1;
  tournament.participants.push(playerAddress);

  if (tournament.currentPlayers >= tournament.maxPlayers) {
    tournament.status = 'Full';
    tournament.statusColor = 'bg-red-500';
  }

  saveTournaments(tournaments);
  return true;
}

// 获取用户参与的比赛
export function getUserTournaments(userAddress: string): Tournament[] {
  const tournaments = getAllTournaments();
  return tournaments.filter(t => t.participants.includes(userAddress));
}

// 提交游戏结果
export function submitGameResult(
  tournamentId: string,
  playerAddress: string,
  score: number
): boolean {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    toast.error('Tournament not found');
    return false;
  }

  // 检查是否已提交过结果
  const existingResult = tournament.results.find(r => r.playerAddress === playerAddress);
  if (existingResult) {
    toast.error('You have already submitted your result');
    return false;
  }

  tournament.results.push({
    playerAddress,
    score,
    timestamp: Date.now()
  });

  saveTournaments(tournaments);
  return true;
}

// 获取排行榜数据
export function getLeaderboardData(options?: {
  gameType?: string;
  timeRange?: 'all' | 'week' | 'month';
}): Array<{
  rank: number;
  address: string;
  totalPrizes: number;
  tournaments: number;
  wins: number;
  gameType?: string;
}> {
  const tournaments = getAllTournaments();
  const { gameType, timeRange = 'all' } = options || {};

  // 筛选比赛
  let filteredTournaments = tournaments;

  if (gameType && gameType !== 'all') {
    filteredTournaments = tournaments.filter(t => t.gameType === gameType);
  }

  if (timeRange !== 'all') {
    const now = Date.now();
    const timeLimit = timeRange === 'week'
      ? 7 * 24 * 60 * 60 * 1000 // 7天
      : 30 * 24 * 60 * 60 * 1000; // 30天

    // 只保留有结果在时间范围内的比赛
    filteredTournaments = filteredTournaments.filter(t =>
      t.results && t.results.some(r => {
        const timeDiff = now - r.timestamp;
        return timeDiff < timeLimit && timeDiff >= 0;
      })
    );
  }

  const playerStats = new Map<string, { prizes: number; tournaments: number; wins: number; gameType: string }>();

  // 统计所有玩家数据
  filteredTournaments.forEach(tournament => {
    if (!tournament.results || tournament.results.length === 0) return;

    tournament.results.forEach((result, index) => {
      // 时间范围过滤
      if (timeRange !== 'all') {
        const now = Date.now();
        const timeLimit = timeRange === 'week'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

        const timeDiff = now - result.timestamp;
        if (timeDiff >= timeLimit || timeDiff < 0) return;
      }

      const player = result.playerAddress;
      const stats = playerStats.get(player) || { prizes: 0, tournaments: 0, wins: 0, gameType: '' };
      stats.tournaments += 1;
      stats.gameType = tournament.gameType;

      // 简单计算奖金：第一名拿50%，前3名按比例分配
      const totalParticipants = Math.max(1, tournament.results.length);
      const prizePerResult = Math.floor(parseInt(tournament.prize || '0') * 0.5 / totalParticipants);
      stats.prizes += prizePerResult;

      if (index === 0) {
        stats.wins += 1;
      }

      playerStats.set(player, stats);
    });
  });

  // 转换为数组并排序
  const leaderboard = Array.from(playerStats.entries())
    .map(([address, stats], index) => ({
      rank: index + 1,
      address: address.slice(0, 6) + '...' + address.slice(-4),
      totalPrizes: stats.prizes,
      tournaments: stats.tournaments,
      wins: stats.wins,
      gameType: stats.gameType
    }))
    .sort((a, b) => b.totalPrizes - a.totalPrizes)
    .slice(0, 50); // 只显示前50名

  // 更新排名
  leaderboard.forEach((player, index) => {
    player.rank = index + 1;
  });

  return leaderboard;
}

// 获取用户统计数据
export function getUserStats(userAddress: string) {
  const userTournaments = getUserTournaments(userAddress);
  const tournaments = getAllTournaments();

  let totalPrizes = 0;
  let wins = 0;

  tournaments.forEach(tournament => {
    if (!tournament.results || tournament.results.length === 0) return;

    tournament.results.forEach((result, index) => {
      if (result.playerAddress === userAddress) {
        if (index === 0) {
          wins += 1;
        }
        const totalParticipants = Math.max(1, tournament.results.length);
        totalPrizes += Math.floor(parseInt(tournament.prize || '0') * 0.5 / totalParticipants);
      }
    });
  });

  return {
    totalTournaments: userTournaments.length,
    totalPrizes,
    wins,
    averageScore: 0 // 可以根据实际结果计算
  };
}

// ==================== 资金管理系统 ====================

const TRANSACTIONS_KEY = 'tournament_transactions';

// 获取所有交易记录
export function getAllTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load transactions:', error);
    return [];
  }
}

// 保存交易记录
function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transactions:', error);
  }
}

// 添加交易记录
export function addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
  const transactions = getAllTransactions();

  const newTransaction: Transaction = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    timestamp: Date.now(),
    ...transaction
  };

  transactions.unshift(newTransaction); // 最新的在前面
  saveTransactions(transactions);

  return newTransaction;
}

// 记录报名费支付
export function recordJoinFee(tournamentId: string, playerAddress: string, entryFee: string): void {
  addTransaction({
    type: 'join_fee',
    fromAddress: playerAddress,
    toAddress: null, // 平台收取
    amount: entryFee,
    tournamentId,
    description: `Tournament join fee: ${entryFee} tokens`
  });

  // 平台收取10%手续费
  const platformFee = (parseFloat(entryFee) * 0.1).toString();
  if (parseFloat(platformFee) > 0) {
    addTransaction({
      type: 'platform_fee',
      fromAddress: playerAddress,
      toAddress: null,
      amount: platformFee,
      tournamentId,
      description: `Platform fee (10%): ${platformFee} tokens`
    });
  }
}

// 计算奖金池（使用 prizePool 字段，已扣除手续费）
function calculatePrizePool(tournament: Tournament): number {
  return parseFloat(tournament.prize);
}

// 记录奖金发放
export function recordPrizePayout(tournamentId: string, winnerAddress: string, prize: string): void {
  addTransaction({
    type: 'prize_payout',
    fromAddress: null, // 平台发放
    toAddress: winnerAddress,
    amount: prize,
    tournamentId,
    description: `Tournament prize payout: ${prize} tokens`
  });
}

// 记录比赛取消退款
export function recordCancelRefund(tournamentId: string, playerAddress: string, refundAmount: string): void {
  addTransaction({
    type: 'cancel_refund',
    fromAddress: null, // 平台发放
    toAddress: playerAddress,
    amount: refundAmount,
    tournamentId,
    description: `Tournament canceled refund: ${refundAmount} tokens`
  });
}

// 获取用户的所有交易
export function getUserTransactions(userAddress: string): Transaction[] {
  const transactions = getAllTransactions();
  return transactions.filter(t =>
    t.fromAddress === userAddress || t.toAddress === userAddress
  );
}

// 获取用户的资金汇总
export function getUserFinancialSummary(userAddress: string): {
  totalPaid: number;
  totalReceived: number;
  netBalance: number;
  transactions: Transaction[];
} {
  const transactions = getUserTransactions(userAddress);

  let totalPaid = 0;
  let totalReceived = 0;

  transactions.forEach(t => {
    if (t.fromAddress === userAddress) {
      totalPaid += parseFloat(t.amount);
    }
    if (t.toAddress === userAddress) {
      totalReceived += parseFloat(t.amount);
    }
  });

  return {
    totalPaid,
    totalReceived,
    netBalance: totalReceived - totalPaid,
    transactions
  };
}

// 处理比赛结束后的奖金分配
export function distributePrizes(tournamentId: string): void {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    console.error('Tournament not found for prize distribution');
    return;
  }

  if (tournament.status !== 'Ended') {
    console.error('Cannot distribute prizes: Tournament not ended');
    return;
  }

  if (tournament.results.length === 0) {
    console.log('No results to distribute prizes');
    return;
  }

  // 计算奖金池
  const prizePool = calculatePrizePool(tournament);
  const sortedResults = [...tournament.results].sort((a, b) => b.score - a.score);

  // 根据分配类型分配奖金
  switch (tournament.distributionType) {
    case '0': // Winner Takes All - 100% 奖金池给第一名
      if (sortedResults.length > 0 && prizePool > 0) {
        recordPrizePayout(tournamentId, sortedResults[0].playerAddress, prizePool.toString());
        console.log(`Winner Takes All: Distributed ${prizePool} tokens to ${sortedResults[0].playerAddress}`);
      }
      break;

    case '1': // Average Split - 所有参与者平分
      const prizePerPlayer = Math.floor(prizePool / sortedResults.length);
      sortedResults.forEach((result) => {
        if (prizePerPlayer > 0) {
          recordPrizePayout(tournamentId, result.playerAddress, prizePerPlayer.toString());
        }
      });
      console.log(`Average Split: Distributed ${prizePool} tokens to ${sortedResults.length} participants (${prizePerPlayer} each)`);
      break;

    case '2': // Top 3 Ranked - 60% / 30% / 10% 分配
      const prizes = [
        Math.floor(prizePool * 0.6), // 第一名 60%
        Math.floor(prizePool * 0.3), // 第二名 30%
        Math.floor(prizePool * 0.1)  // 第三名 10%
      ];

      sortedResults.slice(0, 3).forEach((result, index) => {
        if (prizes[index] > 0) {
          recordPrizePayout(tournamentId, result.playerAddress, prizes[index].toString());
        }
      });
      console.log(`Top 3 Ranked: Distributed ${prizePool} tokens (${prizes.join(' / ')})`);
      break;

    default:
      console.error(`Unknown distribution type: ${tournament.distributionType}`);
      break;
  }
}

// 处理比赛取消时的退款
export function processCancelRefunds(tournamentId: string): void {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    console.error('Tournament not found for refund processing');
    return;
  }

  // 给所有参与者退还报名费（不含平台手续费）
  tournament.participants.forEach(playerAddress => {
    recordCancelRefund(tournamentId, playerAddress, tournament.entryFee);
  });

  console.log(`Processed refunds for ${tournament.participants.length} participants`);
}
