'use client';

import { toast } from 'sonner';

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
  status: 'Open' | 'Full' | 'Ongoing' | 'Ended';
  statusColor: string;
  startTimeOffset: number; // 距离现在多少分钟开始
  duration: number; // 比赛持续时间（分钟）
  creatorAddress: string;
  createdAt: number;
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

// 获取所有比赛
export function getAllTournaments(): Tournament[] {
  if (typeof window === 'undefined') return INITIAL_TOURNAMENTS;

  try {
    const stored = localStorage.getItem('tournaments');
    if (!stored) {
      localStorage.setItem('tournaments', JSON.stringify(INITIAL_TOURNAMENTS));
      return INITIAL_TOURNAMENTS;
    }
    return JSON.parse(stored);
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
export function getLeaderboardData(): Array<{
  rank: number;
  address: string;
  totalPrizes: number;
  tournaments: number;
  wins: number;
}> {
  const tournaments = getAllTournaments();
  const playerStats = new Map<string, { prizes: number; tournaments: number; wins: number }>();

  // 统计所有玩家数据
  tournaments.forEach(tournament => {
    tournament.results.forEach((result, index) => {
      const player = result.playerAddress;
      const stats = playerStats.get(player) || { prizes: 0, tournaments: 0, wins: 0 };
      stats.tournaments += 1;

      // 简单计算奖金：第一名拿50%，前3名按比例分配
      const prizePerResult = Math.floor(parseInt(tournament.prize) * 0.5 / Math.max(1, tournament.results.length));
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
      wins: stats.wins
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
    tournament.results.forEach((result, index) => {
      if (result.playerAddress === userAddress) {
        if (index === 0) {
          wins += 1;
        }
        totalPrizes += Math.floor(parseInt(tournament.prize) * 0.5 / tournament.results.length);
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
