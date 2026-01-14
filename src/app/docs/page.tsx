"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  BookOpen,
  Gamepad2,
  Trophy,
  Coins,
  HelpCircle,
  Shield,
  Clock,
  Users,
  Zap,
  Lock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// 文档导航配置
const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <BookOpen className="w-5 h-5" />,
    subsections: [
      { id: 'what-is-gamefi-arena', title: 'What is GameFi Arena?' },
      { id: 'quick-start', title: 'Quick Start Guide' },
      { id: 'wallet-setup', title: 'Wallet Setup' },
    ],
  },
  {
    id: 'games',
    title: 'Games',
    icon: <Gamepad2 className="w-5 h-5" />,
    subsections: [
      { id: 'number-guess', title: 'Number Guess' },
      { id: 'rock-paper-scissors', title: 'Rock Paper Scissors' },
      { id: 'quick-click', title: 'Quick Click' },
      { id: 'cycle-rift', title: 'Cycle Rift (轮回裂隙)' },
      { id: 'infinite-match', title: 'Infinite Match' },
    ],
  },
  {
    id: 'tournaments',
    title: 'Tournaments',
    icon: <Trophy className="w-5 h-5" />,
    subsections: [
      { id: 'how-tournaments-work', title: 'How Tournaments Work' },
      { id: 'joining-tournaments', title: 'Joining Tournaments' },
      { id: 'submitting-scores', title: 'Submitting Scores' },
      { id: 'prize-distribution', title: 'Prize Distribution' },
      { id: 'platform-rules', title: 'Platform Rules' },
    ],
  },
  {
    id: 'rewards',
    title: 'Rewards',
    icon: <Coins className="w-5 h-5" />,
    subsections: [
      { id: 'how-earn', title: 'How to Earn' },
      { id: 'prize-pools', title: 'Prize Pools' },
      { id: 'leaderboard', title: 'Leaderboard Rewards' },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: <HelpCircle className="w-5 h-5" />,
    subsections: [],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeSubsection, setActiveSubsection] = useState('what-is-gamefi-arena');

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-32 space-y-2">
              {sections.map((section) => (
                <div key={section.id}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setActiveSection(section.id);
                      if (section.subsections.length > 0) {
                        setActiveSubsection(section.subsections[0].id);
                      }
                    }}
                    className={`w-full justify-start transition-colors ${
                      activeSection === section.id
                        ? 'text-white bg-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {section.icon}
                    <span className="ml-2">{section.title}</span>
                    <ChevronRight
                      className={`ml-auto w-4 h-4 transition-transform ${
                        activeSection === section.id ? 'rotate-90' : ''
                      }`}
                    />
                  </Button>

                  {/* Subsections */}
                  {activeSection === section.id && section.subsections.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-4 mt-1 space-y-1"
                    >
                      {section.subsections.map((subsection) => (
                        <Button
                          key={subsection.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveSubsection(subsection.id)}
                          className={`w-full justify-start transition-colors ${
                            activeSubsection === subsection.id
                              ? 'text-blue-400 bg-blue-500/10'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          {subsection.title}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {activeSection === 'getting-started' && (
                <GettingStarted key="getting-started" activeSubsection={activeSubsection} />
              )}
              {activeSection === 'games' && (
                <Games key="games" activeSubsection={activeSubsection} />
              )}
              {activeSection === 'tournaments' && (
                <Tournaments key="tournaments" activeSubsection={activeSubsection} />
              )}
              {activeSection === 'rewards' && (
                <Rewards key="rewards" activeSubsection={activeSubsection} />
              )}
              {activeSection === 'faq' && (
                <FAQ key="faq" />
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  );
}

// Getting Started Component
function GettingStarted({ activeSubsection }: { activeSubsection: string }) {
  return (
    <div className="space-y-8">
      {activeSubsection === 'what-is-gamefi-arena' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 border-none text-white">
              Platform Overview
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              What is GameFi Arena?
            </h1>
            <p className="text-lg text-gray-400">
              GameFi Arena is a blockchain-powered gaming tournament platform where players compete in various skill-based games for real rewards.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Compete & Win</h3>
                  <p className="text-gray-400">
                    Join tournaments, play skill-based games, and compete against other players for real prizes.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Fair & Transparent</h3>
                  <p className="text-gray-400">
                    All tournaments and results are recorded on the blockchain, ensuring fairness and transparency.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Gamepad2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Multiple Games</h3>
                  <p className="text-gray-400">
                    Choose from 5 different skill-based games, each with unique mechanics and strategies.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {activeSubsection === 'quick-start' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-green-500 to-teal-600 border-none text-white">
              Quick Start
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Quick Start Guide
            </h1>
            <p className="text-lg text-gray-400">
              Get started with GameFi Arena in 3 simple steps.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: 1,
                icon: <Lock className="w-6 h-6" />,
                title: 'Connect Your Wallet',
                description: 'Click "Connect Wallet" in the top right corner and choose your preferred wallet (MetaMask, WalletConnect, etc.).',
              },
              {
                step: 2,
                icon: <Trophy className="w-6 h-6" />,
                title: 'Join a Tournament',
                description: 'Browse available tournaments and click "Join" to register. Pay the entry fee to secure your spot.',
              },
              {
                step: 3,
                icon: <Gamepad2 className="w-6 h-6" />,
                title: 'Play & Submit Score',
                description: 'Play the game when the tournament starts, and submit your best score to compete for prizes.',
              },
            ].map((item) => (
              <Card key={item.step} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-blue-500/20 text-blue-400 border-none">Step {item.step}</Badge>
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {activeSubsection === 'wallet-setup' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 border-none text-white">
              Setup Guide
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Wallet Setup
            </h1>
            <p className="text-lg text-gray-400">
              Set up your wallet to participate in tournaments and receive rewards.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Supported Wallets</h3>
              <ul className="space-y-3">
                {['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Trust Wallet', 'Rainbow'].map((wallet) => (
                  <li key={wallet} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    {wallet}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span>Ensure your wallet has enough tokens to cover entry fees</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span>Make sure you're connected to the correct network (Mantle Testnet)</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span>Keep your private keys secure and never share them</span>
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Games Component
function Games({ activeSubsection }: { activeSubsection: string }) {
  const games = [
    {
      id: 'number-guess',
      name: 'Number Guess',
      icon: '🔢',
      description: 'Guess the correct number between 1 and 100 with limited attempts.',
      rules: [
        'You have 10 attempts to guess the number',
        'Higher score = fewer attempts used',
        'After each guess, you get feedback (higher/lower)',
        'Submit your best score to compete',
      ],
      tips: [
        'Use binary search strategy for efficiency',
        'Start with 50 and adjust based on feedback',
        'Keep track of your previous guesses',
      ],
    },
    {
      id: 'rock-paper-scissors',
      name: 'Rock Paper Scissors',
      icon: '✊✋✌️',
      description: 'Classic Rock Paper Scissors against AI, best of 10 rounds.',
      rules: [
        'Play 10 rounds against AI',
        'Win = +1 point, Lose = 0 points, Tie = +0.5 points',
        'Maximum possible score: 10 points',
        'Submit your best score to compete',
      ],
      tips: [
        'AI patterns may emerge over multiple games',
        'Stay unpredictable with your choices',
        'Remember: Rock beats Scissors, Scissors beats Paper, Paper beats Rock',
      ],
    },
    {
      id: 'quick-click',
      name: 'Quick Click',
      icon: '🎯',
      description: 'Click the target as fast as you can within the time limit.',
      rules: [
        'You have 30 seconds to click targets',
        'Targets appear randomly on screen',
        'Higher score = more targets clicked',
        'Submit your best score to compete',
      ],
      tips: [
        'Stay focused and keep your cursor ready',
        'Don\'t waste time moving between clicks',
        'Practice to improve your reaction time',
      ],
    },
    {
      id: 'cycle-rift',
      name: 'Cycle Rift (轮回裂隙)',
      icon: '🌀',
      description: 'Roguelike survival game where you fight waves of monsters and level up.',
      rules: [
        'Survive as long as possible against waves of monsters',
        'Move with WASD or Arrow keys',
        'Auto-attack enemies when in range',
        'Level up to choose from 3 random skill upgrades',
        'Legendary skills unlock at level 25, Mythic at level 30',
        'Score based on survival time and kills',
      ],
      tips: [
        'Balance offense, defense, and mobility skills',
        'Plan your skill build based on your playstyle',
        'Stay mobile to avoid being surrounded',
        'Legendary skills are game-changers, prioritize them',
      ],
    },
    {
      id: 'infinite-match',
      name: 'Infinite Match',
      icon: '🧩',
      description: 'Classic tile-matching puzzle with infinite levels and increasing difficulty.',
      rules: [
        'Match identical tiles with a path of no more than 2 turns',
        'Initial time: 6 minutes',
        'Every 3 levels: board expands (row+2, col+2)',
        'From level 4: time decreases by 45 seconds per level (minimum 60 seconds)',
        'Combo system: 1-3 = +10%, 4-7 = +30%, 8-15 = +60%, 16+ = +100%',
        'Score = 10 × (1 + combo bonus)',
        'Each level guarantees a solution',
      ],
      tips: [
        'Maintain high combo streaks for maximum points',
        'Plan your path to minimize turns',
        'Use shuffle when stuck (available once per level)',
        'Prioritize matches that clear space near edges',
      ],
    },
  ];

  const game = games.find(g => g.id === activeSubsection);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {game ? (
        <div className="space-y-8">
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 border-none text-white">
              Game Guide
            </Badge>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{game.icon}</span>
              <h1 className="text-4xl font-bold text-white">{game.name}</h1>
            </div>
            <p className="text-lg text-gray-400">{game.description}</p>
          </div>

          <Card className="bg-white/5 border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              Rules
            </h2>
            <ul className="space-y-3">
              {game.rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Tips
            </h2>
            <ul className="space-y-3">
              {game.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20">
          <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Select a Game</h2>
          <p className="text-gray-400">Choose a game from the sidebar to view its rules and tips.</p>
        </div>
      )}
    </motion.div>
  );
}

// Tournaments Component
function Tournaments({ activeSubsection }: { activeSubsection: string }) {
  return (
    <div className="space-y-8">
      {activeSubsection === 'how-tournaments-work' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 border-none text-white">
              Tournament Overview
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              How Tournaments Work
            </h1>
            <p className="text-lg text-gray-400">
              Understanding the tournament lifecycle and how to participate.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Registration Phase</h3>
                  <p className="text-gray-400">
                    Tournaments are open for registration during the specified duration. Players can join by paying the entry fee. The tournament starts when the registration period ends or when full.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Competition Phase</h3>
                  <p className="text-gray-400">
                    The tournament enters "Ongoing" status. Participants can now play the game and submit their best scores. You can submit your score only once per tournament.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Grading & Distribution</h3>
                  <p className="text-gray-400">
                    After the competition period ends, the leaderboard is finalized based on submitted scores. Prizes are distributed to the top performers according to the prize distribution rules.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {activeSubsection === 'joining-tournaments' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-green-500 to-teal-600 border-none text-white">
              Registration
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Joining Tournaments
            </h1>
            <p className="text-lg text-gray-400">
              How to register for tournaments and secure your spot.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Before Joining
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <span>Ensure your wallet is connected</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <span>Make sure you have enough tokens for the entry fee</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <span>Check the tournament details (game type, prize pool, duration)</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Important Notes
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>Entry fees are non-refundable once paid</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>You can only join a tournament once</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>Tournaments have limited slots and may fill up quickly</span>
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>
      )}

      {activeSubsection === 'submitting-scores' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 border-none text-white">
              Score Submission
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Submitting Scores
            </h1>
            <p className="text-lg text-gray-400">
              How to submit your game scores for competition.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Submission Rules</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <span><strong>One submission only:</strong> You can only submit your score once per tournament. Choose wisely!</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <span><strong>Time window:</strong> Scores can only be submitted while the tournament is in "Ongoing" status</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <span><strong>Automatic verification:</strong> Scores are verified automatically upon submission</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recommendations</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>Practice in "Try Game" mode before submitting</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>Play multiple practice rounds to find your best strategy</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>Submit when you're confident in your performance</span>
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>
      )}

      {activeSubsection === 'prize-distribution' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-600 border-none text-white">
              Rewards
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Prize Distribution
            </h1>
            <p className="text-lg text-gray-400">
              How prizes are calculated and distributed among winners.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Prize Pool Calculation</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 mb-2">
                    <strong>Effective Prize Pool =</strong> (Entry Fee × Number of Participants) - Platform Fee
                  </p>
                  <p className="text-gray-400 text-sm">
                    Platform Fee: 10% of total entry fees
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 mb-1">
                    <strong>Example:</strong>
                  </p>
                  <p className="text-gray-400 text-sm">
                    10 players × 5 MNT = 50 MNT total entry fees<br/>
                    Platform fee: 50 MNT × 10% = 5 MNT<br/>
                    <strong>Effective prize pool: 50 - 5 = 45 MNT</strong>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Distribution Methods</h3>
              <p className="text-gray-400 mb-4">
                Tournaments can use different prize distribution methods based on the creator's settings:
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none">Winner Takes All</Badge>
                  </div>
                  <p className="text-gray-300">
                    The entire prize pool goes to the player with the highest score. If multiple players have the same top score, the one who submitted earlier wins.
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none">Average Split</Badge>
                  </div>
                  <p className="text-gray-300">
                    The prize pool is divided equally among all participants who submitted a score.
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Example: 10 players, 45 MNT pool → each gets 4.5 MNT
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-none">Top 3 Ranked</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-gray-300">
                      <span>1st Place</span>
                      <span className="text-yellow-400 font-bold">50%</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>2nd Place</span>
                      <span className="text-gray-300 font-bold">30%</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>3rd Place</span>
                      <span className="text-amber-600 font-bold">20%</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    If fewer than 3 players submit scores, prizes are distributed proportionally.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Ranking Rules</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <strong>Primary: Higher Score</strong>
                    <p className="text-gray-400 text-sm">Players with higher scores rank higher</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <strong>Secondary: Earlier Submission</strong>
                    <p className="text-gray-400 text-sm">When scores are equal, the player who submitted earlier gets the higher rank</p>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Automatic Distribution</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>Prizes are distributed <strong>automatically</strong> when the tournament ends</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>Prizes are sent directly to each winner's wallet address</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <span>All transactions are recorded on-chain for transparency</span>
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>
      )}

      {activeSubsection === 'platform-rules' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-red-500 to-pink-600 border-none text-white">
              Platform Rules
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Platform Rules & Policies
            </h1>
            <p className="text-lg text-gray-400">
              Important rules and policies governing all tournaments and interactions on GameFi Arena.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                Platform Fees
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 mb-2">
                    <strong>Standard Fee: 10%</strong>
                  </p>
                  <p className="text-gray-400 text-sm">
                    A 10% service fee is charged on all entry fees collected. This fee supports platform operations and is deducted before calculating the prize pool.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 mb-2">
                    <strong>Non-Refundable on Cancellation</strong>
                  </p>
                  <p className="text-gray-400 text-sm">
                    If a tournament is canceled, the platform fee is NOT refunded. Only the entry fees (minus the 10% fee) are refunded to participants.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Tournament Cancellation Policy
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 mb-2">
                    <strong>Minimum Player Requirement</strong>
                  </p>
                  <p className="text-gray-400 text-sm">
                    Tournament creators can set a minimum number of required participants. If the tournament doesn't reach this threshold by the scheduled start time, it will be automatically canceled.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 mb-2">
                    <strong>Automatic Refund Process</strong>
                  </p>
                  <p className="text-gray-400 text-sm">
                    When a tournament is canceled, entry fees are automatically refunded to all participants' wallets. The refund amount is the entry fee minus the platform fee.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-300 mb-2">
                    <strong>Example</strong>
                  </p>
                  <p className="text-gray-400 text-sm">
                    If 5 players joined with 5 MNT each:<br/>
                    • Total collected: 25 MNT<br/>
                    • Platform fee (10%): 2.5 MNT (kept by platform)<br/>
                    • Refund per player: 22.5 MNT ÷ 5 = 4.5 MNT each
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-400" />
                Entry Fee & Refund Policy
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span><strong>Non-Refundable:</strong> Entry fees are non-refundable once the tournament has started and participants have begun competing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span><strong>One Entry Per Player:</strong> Each wallet address can only join a specific tournament once.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span><strong>Time Window:</strong> You can only submit scores while the tournament is in "Ongoing" status (between start and end time).</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-400" />
                Transaction Types & Financial Records
              </h3>
              <p className="text-gray-400 mb-4">
                All financial transactions are recorded and traceable. The following transaction types exist:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <Badge className="bg-blue-500/20 text-blue-400 border-none mt-0.5">join_fee</Badge>
                  <span className="text-gray-300">Entry fee payment when joining a tournament</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <Badge className="bg-purple-500/20 text-purple-400 border-none mt-0.5">platform_fee</Badge>
                  <span className="text-gray-300">10% platform fee deduction from entry fees</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-none mt-0.5">prize_payout</Badge>
                  <span className="text-gray-300">Prize distribution to winners after tournament ends</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <Badge className="bg-red-500/20 text-red-400 border-none mt-0.5">cancel_refund</Badge>
                  <span className="text-gray-300">Refund to participants when tournament is canceled</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                Fair Play & Security
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span><strong>On-Chain Transparency:</strong> All tournament results and transactions are recorded on the blockchain for transparency and immutability.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span><strong>Score Verification:</strong> Scores are verified automatically upon submission to ensure validity.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span><strong>Try Game Mode:</strong> Practice mode is available for all games without wallet connection or score submission.</span>
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Rewards Component
function Rewards({ activeSubsection }: { activeSubsection: string }) {
  return (
    <div className="space-y-8">
      {activeSubsection === 'how-earn' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-green-500 to-teal-600 border-none text-white">
              Earning
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              How to Earn
            </h1>
            <p className="text-lg text-gray-400">
              Multiple ways to earn rewards on GameFi Arena.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Tournament Prizes
              </h3>
              <p className="text-gray-400 mb-4">
                Win tournaments to earn a share of the prize pool. The distribution method depends on the tournament settings.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong>Winner Takes All:</strong> All prizes go to the top scorer</li>
                <li>• <strong>Average Split:</strong> Prizes divided equally among all participants</li>
                <li>• <strong>Top 3 Ranked:</strong> 50% / 30% / 20% split for top 3 players</li>
              </ul>
              <p className="text-gray-400 text-sm mt-3">
                Platform fee: 10% deducted from all entry fees
              </p>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Leaderboard Rewards
              </h3>
              <p className="text-gray-400 mb-4">
                Compete on the global leaderboard for additional rewards and recognition.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Weekly leaderboard bonuses</li>
                <li>• Monthly leaderboard competitions</li>
                <li>• Special seasonal tournaments</li>
              </ul>
            </Card>
          </div>
        </motion.div>
      )}

      {activeSubsection === 'prize-pools' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-600 border-none text-white">
              Prize Pools
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Prize Pools
            </h1>
            <p className="text-lg text-gray-400">
              Understanding how prize pools are structured and funded.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Prize Pool Structure</h3>
              <p className="text-gray-400 mb-4">
                Prize pools are determined by the tournament creator and funded by entry fees from all participants.
              </p>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-gray-300 mb-2">
                  <strong>Total Prize Pool =</strong> Entry Fee × Number of Participants
                </p>
                <p className="text-gray-400 text-sm">
                  Example: 100 players × 10 MNT = 1,000 MNT total prize pool
                </p>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Tournament Types</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <Coins className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <strong>Fixed Prize Pool:</strong> Creator sets a guaranteed prize regardless of participants
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Coins className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <strong>Entry Fee Based:</strong> Prize pool grows with more participants
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Coins className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <strong>Hybrid:</strong> Base prize + bonus from entry fees
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </motion.div>
      )}

      {activeSubsection === 'leaderboard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 border-none text-white">
              Competition
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">
              Leaderboard Rewards
            </h1>
            <p className="text-lg text-gray-400">
              Climb the leaderboards for additional rewards and glory.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Leaderboard Types</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <strong>All-Time:</strong> Rankings based on total career performance
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <strong>Weekly:</strong> Rankings reset weekly, compete for weekly rewards
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <strong>Game-Specific:</strong> Rankings per game type
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Reward Tiers</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg">
                  <span className="text-white">Top 3 Weekly</span>
                  <Badge className="bg-yellow-500 text-white border-none">Special Bonus</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-500/10 rounded-lg">
                  <span className="text-white">Top 10 Monthly</span>
                  <Badge className="bg-gray-400 text-white border-none">Reward Points</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
                  <span className="text-white">Top 100 All-Time</span>
                  <Badge className="bg-blue-500 text-white border-none">Exclusive Badges</Badge>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// FAQ Component
function FAQ() {
  const faqs = [
    {
      question: 'What is GameFi Arena?',
      answer: 'GameFi Arena is a blockchain-powered gaming tournament platform where players compete in skill-based games for real rewards. All tournaments are recorded on-chain for transparency.',
    },
    {
      question: 'How do I get started?',
      answer: 'Connect your wallet, browse available tournaments, join by paying the entry fee, and play the game during the competition period. Submit your best score to compete for prizes.',
    },
    {
      question: 'Can I play games without joining a tournament?',
      answer: 'Yes! You can use the "Try Game" feature to practice any game without connecting your wallet or joining a tournament. Practice mode scores are not saved.',
    },
    {
      question: 'How are prizes distributed?',
      answer: 'Prizes are distributed based on the tournament\'s distribution method. The effective prize pool is calculated as (Entry Fee × Number of Participants) - 10% platform fee. Three distribution methods are available: Winner Takes All (all to top scorer), Average Split (divided equally among all participants), and Top 3 Ranked (50%, 30%, 20% split). Prizes are sent automatically to winners\' wallets when the tournament ends.',
    },
    {
      question: 'Can I submit multiple scores?',
      answer: 'No, you can only submit one score per tournament. Make sure to practice first using the "Try Game" feature before submitting your official score. Your submission time is recorded and used as a tiebreaker.',
    },
    {
      question: 'What happens if a tournament doesn\'t reach the minimum number of players?',
      answer: 'When the tournament starts, if the number of participants is below the minimum threshold (set by the creator), the tournament will be automatically canceled. Entry fees will be refunded to all participants. Note: The 10% platform fee is NOT refunded in cancellations.',
    },
    {
      question: 'How are tie scores resolved?',
      answer: 'Ranking is determined by two factors: 1) Higher score ranks higher, 2) If scores are equal, the player who submitted their score earlier receives the higher rank. This ensures fair competition when players achieve the same score.',
    },
    {
      question: 'What fees does the platform charge?',
      answer: 'The platform charges a 10% service fee on all entry fees collected. This fee is deducted from the total entry fees before calculating the prize pool. The platform fee is NOT refunded in case of tournament cancellation.',
    },
    {
      question: 'Is my wallet secure?',
      answer: 'We use industry-standard security practices and integrate with reputable wallet providers. Never share your private keys or seed phrase with anyone.',
    },
    {
      question: 'Can I create my own tournament?',
      answer: 'Yes! Use the "Create Tournament" feature to set up your own tournament. You can choose the game type, entry fee, prize pool, and other parameters.',
    },
    {
      question: 'What games are available?',
      answer: 'We currently offer 5 skill-based games: Number Guess, Rock Paper Scissors, Quick Click, Cycle Rift (Roguelike Survival), and Infinite Match (Tile Matching).',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 border-none text-white">
          Help Center
        </Badge>
        <h1 className="text-4xl font-bold text-white mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-gray-400">
          Common questions and answers about GameFi Arena.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index} className="bg-white/5 border-white/10 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                {faq.question}
              </h3>
              <p className="text-gray-400 ml-8">{faq.answer}</p>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
