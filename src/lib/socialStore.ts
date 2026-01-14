'use client';

import { toast } from 'sonner';

// ==================== 消息系统 ====================

// 消息类型
export type MessageType = 'friend_request' | 'message' | 'system' | 'tournament_chat';

// 消息数据
export interface Message {
  id: string;
  type: MessageType;
  fromAddress: string;
  toAddress?: string; // 好友聊天：接收者地址；比赛聊天：可选
  tournamentId?: string; // 比赛聊天：比赛ID
  content: string;
  timestamp: number;
  read: boolean;
}

// ==================== 好友系统 ====================

// 好友关系状态
export type FriendStatus = 'pending' | 'accepted' | 'rejected';

// 好友关系数据
export interface FriendRelation {
  id: string;
  requester: string; // 发起好友请求的地址
  accepter: string;  // 接受好友请求的地址
  status: FriendStatus;
  createdAt: number;
}

// ==================== 点赞系统 ====================

// 点赞数据
export interface Like {
  id: string;
  fromAddress: string; // 点赞者的地址
  toAddress: string;   // 被点赞者的地址
  timestamp: number;
}

// ==================== 成就系统 ====================

// 成就类型
export type AchievementCategory = 'game' | 'social' | 'tournament';

// 成就数据
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  reward: number; // 奖励代币数量
  condition: string; // 触发条件描述
}

// 用户成就记录
export interface UserAchievement {
  achievementId: string;
  userAddress: string;
  unlockedAt: number;
}

// ==================== 等级系统 ====================

// 用户等级数据
export interface UserLevel {
  address: string;
  level: number;
  experience: number;
  nextLevelExp: number;
}

// ==================== 代币系统 ====================

// 代币交易类型
export type TokenType = 'earn' | 'spend' | 'reward';

// 代币交易记录
export interface TokenTransaction {
  id: string;
  type: TokenType;
  amount: number;
  description: string;
  timestamp: number;
}

// 用户代币余额
export interface UserTokenBalance {
  address: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

// ==================== 数据存储函数 ====================

const MESSAGES_KEY = 'social_messages';
const FRIENDS_KEY = 'social_friends';
const LIKES_KEY = 'social_likes';
const ACHIEVEMENTS_KEY = 'social_achievements';
const USER_ACHIEVEMENTS_KEY = 'social_user_achievements';
const USER_LEVELS_KEY = 'social_user_levels';
const TOKEN_BALANCES_KEY = 'social_token_balances';
const TOKEN_TRANSACTIONS_KEY = 'social_token_transactions';
const TOURNAMENT_CHATS_KEY = 'social_tournament_chats'; // 比赛聊天室

// ==================== 比赛聊天室数据结构 ====================

export interface TournamentChat {
  tournamentId: string;
  createdAt: number;
  lastActivity: number; // 最后活动时间，用于清理
}

// ==================== 消息系统函数 ====================

export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

function saveMessages(messages: Message[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}

export function sendMessage(
  fromAddress: string,
  toAddress: string,
  content: string,
  type: MessageType = 'message'
): Message {
  const messages = getAllMessages();

  const newMessage: Message = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    type,
    fromAddress,
    toAddress,
    content,
    timestamp: Date.now(),
    read: false,
  };

  messages.push(newMessage);
  saveMessages(messages);

  return newMessage;
}

export function getConversation(userAddress: string, otherAddress: string): Message[] {
  const messages = getAllMessages();
  return messages
    .filter(m =>
      (m.fromAddress === userAddress && m.toAddress === otherAddress) ||
      (m.fromAddress === otherAddress && m.toAddress === userAddress)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getUnreadMessages(userAddress: string): Message[] {
  const messages = getAllMessages();
  return messages.filter(m => m.toAddress === userAddress && !m.read);
}

export function markMessagesAsRead(userAddress: string, fromAddress: string): void {
  const messages = getAllMessages();
  let updated = false;

  messages.forEach(m => {
    if (m.toAddress === userAddress && m.fromAddress === fromAddress && !m.read) {
      m.read = true;
      updated = true;
    }
  });

  if (updated) {
    saveMessages(messages);
  }
}

export function getInbox(userAddress: string): Message[] {
  const messages = getAllMessages();
  return messages
    .filter(m => m.toAddress === userAddress)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ==================== 好友系统函数 ====================

export function getAllFriends(): FriendRelation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FRIENDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load friends:', error);
    return [];
  }
}

function saveFriends(friends: FriendRelation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (error) {
    console.error('Failed to save friends:', error);
  }
}

export function sendFriendRequest(fromAddress: string, toAddress: string): FriendRelation | null {
  const friends = getAllFriends();

  // 检查是否已经是好友或有待处理的请求
  const existing = friends.find(
    f =>
      (f.requester === fromAddress && f.accepter === toAddress) ||
      (f.requester === toAddress && f.accepter === fromAddress)
  );

  if (existing) {
    if (existing.status === 'accepted') {
      toast.error('You are already friends');
      return null;
    }
    if (existing.status === 'pending') {
      toast.error('Friend request already pending');
      return null;
    }
  }

  const newRelation: FriendRelation = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    requester: fromAddress,
    accepter: toAddress,
    status: 'pending',
    createdAt: Date.now(),
  };

  friends.push(newRelation);
  saveFriends(friends);

  // 发送系统通知
  sendMessage(fromAddress, toAddress, 'sent you a friend request', 'friend_request');

  toast.success('Friend request sent');
  return newRelation;
}

export function acceptFriendRequest(relationId: string): boolean {
  const friends = getAllFriends();
  const relation = friends.find(f => f.id === relationId);

  if (!relation) {
    toast.error('Friend request not found');
    return false;
  }

  if (relation.status !== 'pending') {
    toast.error('This request is no longer valid');
    return false;
  }

  relation.status = 'accepted';
  saveFriends(friends);

  toast.success('Friend added!');
  return true;
}

export function rejectFriendRequest(relationId: string): boolean {
  const friends = getAllFriends();
  const relation = friends.find(f => f.id === relationId);

  if (!relation) {
    toast.error('Friend request not found');
    return false;
  }

  if (relation.status !== 'pending') {
    toast.error('This request is no longer valid');
    return false;
  }

  relation.status = 'rejected';
  saveFriends(friends);

  toast.info('Friend request declined');
  return true;
}

export function getUserFriends(userAddress: string): FriendRelation[] {
  const friends = getAllFriends();
  return friends.filter(
    f =>
      (f.requester === userAddress || f.accepter === userAddress) &&
      f.status === 'accepted'
  );
}

export function getPendingFriendRequests(userAddress: string): FriendRelation[] {
  const friends = getAllFriends();
  return friends.filter(
    f => f.accepter === userAddress && f.status === 'pending'
  );
}

export function isFriend(userAddress: string, otherAddress: string): boolean {
  const friends = getAllFriends();
  return friends.some(
    f =>
      f.status === 'accepted' &&
      ((f.requester === userAddress && f.accepter === otherAddress) ||
        (f.requester === otherAddress && f.accepter === userAddress))
  );
}

// ==================== 点赞系统函数 ====================

export function getAllLikes(): Like[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LIKES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load likes:', error);
    return [];
  }
}

function saveLikes(likes: Like[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  } catch (error) {
    console.error('Failed to save likes:', error);
  }
}

export function likeProfile(fromAddress: string, toAddress: string): Like | null {
  const likes = getAllLikes();

  // 检查是否已经点赞
  const existing = likes.find(
    l => l.fromAddress === fromAddress && l.toAddress === toAddress
  );

  if (existing) {
    toast.error('You have already liked this profile');
    return null;
  }

  const newLike: Like = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    fromAddress,
    toAddress,
    timestamp: Date.now(),
  };

  likes.push(newLike);
  saveLikes(likes);

  toast.success('Liked!');
  return newLike;
}

export function getProfileLikes(userAddress: string): number {
  const likes = getAllLikes();
  return likes.filter(l => l.toAddress === userAddress).length;
}

export function hasLiked(fromAddress: string, toAddress: string): boolean {
  const likes = getAllLikes();
  return likes.some(
    l => l.fromAddress === fromAddress && l.toAddress === toAddress
  );
}

// ==================== 成就系统函数 ====================

// 预定义成就列表
const ACHIEVEMENTS: Achievement[] = [
  // 游戏类成就
  {
    id: 'first_game',
    name: 'First Step',
    description: 'Play your first game',
    category: 'game',
    icon: '🎮',
    reward: 10,
    condition: 'Complete any game',
  },
  {
    id: 'five_games',
    name: 'Regular Player',
    description: 'Play 5 games',
    category: 'game',
    icon: '🎯',
    reward: 20,
    condition: 'Complete 5 games',
  },
  {
    id: 'high_score_100',
    name: 'Century',
    description: 'Score over 100 in any game',
    category: 'game',
    icon: '💯',
    reward: 30,
    condition: 'Achieve a score of 100+',
  },
  {
    id: 'tournament_winner',
    name: 'Champion',
    description: 'Win a tournament',
    category: 'tournament',
    icon: '🏆',
    reward: 50,
    condition: 'Place 1st in a tournament',
  },
  {
    id: 'first_tournament',
    name: 'Competitor',
    description: 'Join your first tournament',
    category: 'tournament',
    icon: '⚔️',
    reward: 15,
    condition: 'Join a tournament',
  },
  // 社交类成就
  {
    id: 'first_friend',
    name: 'Making Friends',
    description: 'Add your first friend',
    category: 'social',
    icon: '🤝',
    reward: 10,
    condition: 'Add a friend',
  },
  {
    id: 'five_friends',
    name: 'Social Butterfly',
    description: 'Have 5 friends',
    category: 'social',
    icon: '🦋',
    reward: 30,
    condition: 'Add 5 friends',
  },
];

export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}

export function getUserAchievements(userAddress: string): UserAchievement[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(USER_ACHIEVEMENTS_KEY);
    const all: UserAchievement[] = stored ? JSON.parse(stored) : [];
    return all.filter(ua => ua.userAddress === userAddress);
  } catch (error) {
    console.error('Failed to load user achievements:', error);
    return [];
  }
}

function saveUserAchievements(achievements: UserAchievement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('Failed to save user achievements:', error);
  }
}

export function unlockAchievement(userAddress: string, achievementId: string): boolean {
  const userAchievements = getUserAchievements(userAddress);

  // 检查是否已解锁
  if (userAchievements.some(ua => ua.achievementId === achievementId)) {
    return false;
  }

  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) {
    return false;
  }

  const newUserAchievement: UserAchievement = {
    achievementId,
    userAddress,
    unlockedAt: Date.now(),
  };

  // 保存
  const allUserAchievements = JSON.parse(localStorage.getItem(USER_ACHIEVEMENTS_KEY) || '[]');
  allUserAchievements.push(newUserAchievement);
  saveUserAchievements(allUserAchievements);

  // 发放奖励
  addTokenReward(userAddress, achievement.reward, `Achievement: ${achievement.name}`);

  // 通知
  toast.success(`Achievement Unlocked: ${achievement.name}!`, {
    description: `+${achievement.reward} BLZ tokens`,
  });

  return true;
}

export function checkAndUnlockGameAchievement(userAddress: string, score: number, gamesPlayed: number): void {
  // 首次玩游戏
  if (gamesPlayed === 1) {
    unlockAchievement(userAddress, 'first_game');
  }

  // 玩5局游戏
  if (gamesPlayed === 5) {
    unlockAchievement(userAddress, 'five_games');
  }

  // 高分成就
  if (score >= 100) {
    unlockAchievement(userAddress, 'high_score_100');
  }
}

export function checkAndUnlockSocialAchievement(userAddress: string): void {
  const friends = getUserFriends(userAddress);

  if (friends.length === 1) {
    unlockAchievement(userAddress, 'first_friend');
  }

  if (friends.length === 5) {
    unlockAchievement(userAddress, 'five_friends');
  }
}

// ==================== 等级系统函数 ====================

export function getUserLevelData(userAddress: string): UserLevel {
  if (typeof window === 'undefined') {
    return { address: userAddress, level: 1, experience: 0, nextLevelExp: 100 };
  }

  try {
    const stored = localStorage.getItem(USER_LEVELS_KEY);
    const all: UserLevel[] = stored ? JSON.parse(stored) : [];
    const existing = all.find(l => l.address === userAddress);

    if (existing) {
      return existing;
    }

    // 初始化新用户
    const newLevel: UserLevel = {
      address: userAddress,
      level: 1,
      experience: 0,
      nextLevelExp: 100,
    };

    all.push(newLevel);
    localStorage.setItem(USER_LEVELS_KEY, JSON.stringify(all));
    return newLevel;
  } catch (error) {
    console.error('Failed to load user level:', error);
    return { address: userAddress, level: 1, experience: 0, nextLevelExp: 100 };
  }
}

function saveUserLevels(levels: UserLevel[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_LEVELS_KEY, JSON.stringify(levels));
  } catch (error) {
    console.error('Failed to save user levels:', error);
  }
}

export function addExperience(userAddress: string, exp: number): void {
  const allLevels: UserLevel[] = JSON.parse(localStorage.getItem(USER_LEVELS_KEY) || '[]');
  const userLevel = allLevels.find(l => l.address === userAddress);

  if (!userLevel) {
    // 初始化
    allLevels.push({
      address: userAddress,
      level: 1,
      experience: 0,
      nextLevelExp: 100,
    });
    return;
  }

  userLevel.experience += exp;

  // 检查是否升级
  while (userLevel.experience >= userLevel.nextLevelExp) {
    userLevel.experience -= userLevel.nextLevelExp;
    userLevel.level += 1;
    userLevel.nextLevelExp = Math.floor(userLevel.nextLevelExp * 1.5); // 每级需要1.5倍经验

    toast.success(`Level Up!`, {
      description: `You are now level ${userLevel.level}!`,
    });
  }

  saveUserLevels(allLevels);
}

// ==================== 代币系统函数 ====================

export function getUserTokenBalance(userAddress: string): UserTokenBalance {
  if (typeof window === 'undefined') {
    return { address: userAddress, balance: 0, totalEarned: 0, totalSpent: 0 };
  }

  try {
    const stored = localStorage.getItem(TOKEN_BALANCES_KEY);
    const all: UserTokenBalance[] = stored ? JSON.parse(stored) : [];
    const existing = all.find(b => b.address === userAddress);

    if (existing) {
      return existing;
    }

    // 初始化新用户
    const newBalance: UserTokenBalance = {
      address: userAddress,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    };

    all.push(newBalance);
    localStorage.setItem(TOKEN_BALANCES_KEY, JSON.stringify(all));
    return newBalance;
  } catch (error) {
    console.error('Failed to load token balance:', error);
    return { address: userAddress, balance: 0, totalEarned: 0, totalSpent: 0 };
  }
}

function saveTokenBalances(balances: UserTokenBalance[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_BALANCES_KEY, JSON.stringify(balances));
  } catch (error) {
    console.error('Failed to save token balances:', error);
  }
}

export function addTokenReward(userAddress: string, amount: number, description: string): void {
  const allBalances: UserTokenBalance[] = JSON.parse(localStorage.getItem(TOKEN_BALANCES_KEY) || '[]');
  const userBalance = allBalances.find(b => b.address === userAddress);

  if (!userBalance) {
    allBalances.push({
      address: userAddress,
      balance: amount,
      totalEarned: amount,
      totalSpent: 0,
    });
  } else {
    userBalance.balance += amount;
    userBalance.totalEarned += amount;
  }

  saveTokenBalances(allBalances);

  // 记录交易
  recordTokenTransaction(userAddress, 'earn', amount, description);

  // 增加经验值（1代币 = 1经验）
  addExperience(userAddress, amount);
}

export function spendTokens(userAddress: string, amount: number, description: string): boolean {
  const allBalances: UserTokenBalance[] = JSON.parse(localStorage.getItem(TOKEN_BALANCES_KEY) || '[]');
  const userBalance = allBalances.find(b => b.address === userAddress);

  if (!userBalance || userBalance.balance < amount) {
    toast.error('Insufficient balance');
    return false;
  }

  userBalance.balance -= amount;
  userBalance.totalSpent += amount;

  saveTokenBalances(allBalances);

  // 记录交易
  recordTokenTransaction(userAddress, 'spend', amount, description);

  return true;
}

export function getAllTokenTransactions(): TokenTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TOKEN_TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load token transactions:', error);
    return [];
  }
}

function recordTokenTransaction(userAddress: string, type: TokenType, amount: number, description: string): void {
  const transactions = getAllTokenTransactions();

  const newTransaction: TokenTransaction = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    type,
    amount,
    description,
    timestamp: Date.now(),
  };

  transactions.unshift(newTransaction);
  localStorage.setItem(TOKEN_TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function getUserTokenTransactions(userAddress: string): TokenTransaction[] {
  const transactions = getAllTokenTransactions();
  return transactions.filter(t => t.description.includes(userAddress.slice(0, 10)));
}

// ==================== 代币发放机制 ====================

// 参与比赛基础奖励：3 BLZ
export const TOURNAMENT_PARTICIPATION_REWARD = 3;

// 前三名额外奖励
export const TOURNAMENT_RANK_REWARDS = {
  1: 20, // 第一名额外20 BLZ
  2: 10, // 第二名额外10 BLZ
  3: 5,  // 第三名额外5 BLZ
};

// 周任务奖励
export const WEEKLY_TASK_REWARDS = {
  complete_games: 30,  // 完成10场游戏：30 BLZ
  join_tournaments: 20, // 参加3场比赛：20 BLZ
  add_friends: 15,     // 添加3个好友：15 BLZ
};

// 成就系统奖励：已在成就定义中

// ==================== 比赛聊天室函数 ====================

export function getAllTournamentChats(): TournamentChat[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TOURNAMENT_CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load tournament chats:', error);
    return [];
  }
}

function saveTournamentChats(chats: TournamentChat[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOURNAMENT_CHATS_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Failed to save tournament chats:', error);
  }
}

// 创建比赛聊天室
export function createTournamentChat(tournamentId: string): TournamentChat {
  const chats = getAllTournamentChats();

  const newChat: TournamentChat = {
    tournamentId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  chats.push(newChat);
  saveTournamentChats(chats);

  // 发送系统消息
  sendTournamentMessage(
    '0x0000000000000000000000000000000000000000',
    tournamentId,
    'Chat room created'
  );

  return newChat;
}

// 发送比赛消息
export function sendTournamentMessage(
  fromAddress: string,
  tournamentId: string,
  content: string
): Message {
  const messages = getAllMessages();

  const newMessage: Message = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    type: 'tournament_chat',
    fromAddress,
    tournamentId,
    content,
    timestamp: Date.now(),
    read: true, // 聊天室消息默认为已读
  };

  messages.push(newMessage);
  saveMessages(messages);

  // 更新聊天室最后活动时间
  updateTournamentChatActivity(tournamentId);

  return newMessage;
}

// 获取比赛聊天消息
export function getTournamentMessages(tournamentId: string): Message[] {
  const messages = getAllMessages();
  return messages
    .filter(m => m.type === 'tournament_chat' && m.tournamentId === tournamentId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

// 更新聊天室活动时间
export function updateTournamentChatActivity(tournamentId: string): void {
  const chats = getAllTournamentChats();
  const chat = chats.find(c => c.tournamentId === tournamentId);

  if (chat) {
    chat.lastActivity = Date.now();
    saveTournamentChats(chats);
  }
}

// 检查聊天室是否存在
export function tournamentChatExists(tournamentId: string): boolean {
  const chats = getAllTournamentChats();
  return chats.some(c => c.tournamentId === tournamentId);
}

// 清理过期的聊天室（比赛结束后24小时）
export function cleanupOldTournamentChats(): void {
  const chats = getAllTournamentChats();
  const now = Date.now();
  const cleanupThreshold = 24 * 60 * 60 * 1000; // 24小时

  const activeChats = chats.filter(c => now - c.lastActivity < cleanupThreshold);

  if (activeChats.length !== chats.length) {
    saveTournamentChats(activeChats);

    // 清理相关消息
    const messages = getAllMessages();
    const activeTournamentIds = activeChats.map(c => c.tournamentId);
    const filteredMessages = messages.filter(
      m => m.type !== 'tournament_chat' || (m.tournamentId && activeTournamentIds.includes(m.tournamentId))
    );
    saveMessages(filteredMessages);
  }
}

// 删除特定聊天室
export function deleteTournamentChat(tournamentId: string): void {
  const chats = getAllTournamentChats();
  const filtered = chats.filter(c => c.tournamentId !== tournamentId);
  saveTournamentChats(filtered);

  // 清理相关消息
  const messages = getAllMessages();
  const filteredMessages = messages.filter(m => m.tournamentId !== tournamentId);
  saveMessages(filteredMessages);
}
