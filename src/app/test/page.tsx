"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import InfiniteMatchGameTest from "@/components/games/InfiniteMatchGameTest";
import NumberGuessGameTest from "@/components/games/NumberGuessGameTest";
import QuickClickGameTest from "@/components/games/QuickClickGameTest";
import RockPaperScissorsGameTest from "@/components/games/RockPaperScissorsGameTest";
import RoguelikeSurvivalGameTest from "@/components/games/RoguelikeSurvivalGameTest";
import { 
  Gamepad2, 
  ArrowLeft, 
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  Hash,
  Target,
  Hand,
  Sword
} from "lucide-react";

export default function TestPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: 'infinite-match',
      name: '无限消除',
      nameEn: 'Infinite Match',
      description: '连连看玩法，连接相同的方块进行消除',
      descriptionEn: 'Link matching tiles to eliminate them',
      icon: Gamepad2,
      color: 'from-violet-600 via-fuchsia-600 to-pink-600',
      category: '消除游戏',
      categoryEn: 'Match-3'
    },
    {
      id: 'number-guess',
      name: '猜数字',
      nameEn: 'Number Guess',
      description: '在5次内猜中1-100之间的随机数字',
      descriptionEn: 'Guess a random number 1-100 within 5 attempts',
      icon: Hash,
      color: 'from-purple-600 via-blue-600 to-cyan-600',
      category: '益智游戏',
      categoryEn: 'Puzzle'
    },
    {
      id: 'quick-click',
      name: '快速点击',
      nameEn: 'Quick Click',
      description: '30秒内尽可能多地点击目标，手速挑战',
      descriptionEn: 'Click targets as many times as possible in 30 seconds',
      icon: Target,
      color: 'from-orange-600 via-red-600 to-pink-600',
      category: '反应游戏',
      categoryEn: 'Reflex'
    },
    {
      id: 'rock-paper-scissors',
      name: '石头剪刀布',
      nameEn: 'Rock Paper Scissors',
      description: '与AI进行10轮对决，策略对战',
      descriptionEn: 'Play 10 rounds against AI with strategy',
      icon: Hand,
      color: 'from-green-600 via-teal-600 to-emerald-600',
      category: '策略游戏',
      categoryEn: 'Strategy'
    },
    {
      id: 'roguelike-survival',
      name: '轮回裂隙',
      nameEn: 'Rift of Rebirth',
      description: '肉鸽割草游戏，击杀怪物升级，无限挑战',
      descriptionEn: 'Roguelike survival, kill monsters to level up',
      icon: Sword,
      color: 'from-red-600 via-orange-600 to-yellow-600',
      category: '动作游戏',
      categoryEn: 'Action'
    }
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: '无需钱包',
      description: '测试模式不需要连接钱包，可以直接体验游戏'
    },
    {
      icon: Zap,
      title: '完整体验',
      description: '所有游戏功能均可正常使用，包括音效、动画等'
    },
    {
      icon: Info,
      title: '不保存成绩',
      description: '测试模式的成绩不会保存到区块链或排行榜'
    }
  ];

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          <Button
            onClick={() => setSelectedGame(null)}
            variant="outline"
            className="mb-6 bg-slate-900/50 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回游戏列表
          </Button>

          {selectedGame === 'infinite-match' && (
            <InfiniteMatchGameTest onCancel={() => setSelectedGame(null)} />
          )}

          {selectedGame === 'number-guess' && (
            <NumberGuessGameTest onCancel={() => setSelectedGame(null)} />
          )}

          {selectedGame === 'quick-click' && (
            <QuickClickGameTest onCancel={() => setSelectedGame(null)} />
          )}

          {selectedGame === 'rock-paper-scissors' && (
            <RockPaperScissorsGameTest onCancel={() => setSelectedGame(null)} />
          )}

          {selectedGame === 'roguelike-survival' && (
            <RoguelikeSurvivalGameTest onCancel={() => setSelectedGame(null)} />
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      {/* 顶部导航 */}
      <div className="container mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">游戏测试模式</h1>
              <p className="text-sm text-gray-400">无需钱包 · 完整体验 · 无保存</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-6 py-8">
        {/* 功能特性 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <feature.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* 游戏列表 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-2xl font-bold text-white">可用游戏</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="group"
              >
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm border-purple-500/20 overflow-hidden cursor-pointer hover:border-purple-500/40 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl">
                        <game.icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-violet-500/20 border border-violet-500/40 rounded-full text-xs text-violet-400">
                        {game.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                      {game.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {game.nameEn}
                      </span>
                      <Button
                        onClick={() => setSelectedGame(game.id)}
                        className={`bg-gradient-to-r ${game.color} hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all`}
                      >
                        开始测试
                        <Zap className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 提示信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">关于测试模式</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                测试模式专用于游戏体验和功能测试。在此模式下，您无需连接钱包即可体验完整的游戏功能。
                请注意，测试模式下获得的成绩不会保存到区块链或排行榜中。如果您想参与正式比赛并赢取奖励，
                请返回主页面连接钱包后参加比赛。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
