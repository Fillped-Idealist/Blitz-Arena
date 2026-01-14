"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Gamepad2,
} from "lucide-react";

const stats = [
  { label: "Active Tournaments", value: "1.2K+", icon: Trophy },
  { label: "Players", value: "45K+", icon: Users },
  { label: "Prize Pool", value: "$2.5M", icon: Zap },
  { label: "Secure Matches", value: "10K+", icon: Shield },
];

const features = [
  {
    title: "Instant Payouts",
    description:
      "Smart contracts ensure immediate prize distribution upon tournament completion.",
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Fair Competition",
    description:
      "Transparent results verified on the blockchain with immutable records.",
    icon: Shield,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Global Reach",
    description: "Compete with players worldwide in real-time tournaments.",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
  },
];

const upcomingTournaments = [
  {
    id: 1,
    title: "Championship League",
    game: "Battle Royale",
    prize: "10,000",
    players: "128/128",
    status: "In Progress",
    statusColor: "bg-green-500",
    startsIn: "2h 30m",
  },
  {
    id: 2,
    title: "Weekly Cup",
    game: "Speed Challenge",
    prize: "5,000",
    players: "64/64",
    status: "Starting Soon",
    statusColor: "bg-yellow-500",
    startsIn: "30m",
  },
  {
    id: 3,
    title: "Pro Series",
    game: "Strategy Arena",
    prize: "25,000",
    players: "32/64",
    status: "Open",
    statusColor: "bg-blue-500",
    startsIn: "1d 5h",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-1/2 -left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 border-none text-white">
                Next Gen Gaming Platform
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Compete. Win.
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Earn on Chain.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              The ultimate blockchain gaming platform where skill meets reward.
              Create tournaments, compete globally, and get paid instantly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/tournaments">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                  Browse Tournaments
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="group text-white border-white/20 hover:border-white/40 hover:bg-white/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  <Sparkles className="mr-2 w-5 h-5" />
                  Create Tournament
                </Button>
              </Link>
              <Link href="/test">
                <Button
                  size="lg"
                  variant="outline"
                  className="group text-violet-400 border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  <Gamepad2 className="mr-2 w-5 h-5" />
                  Test Mode
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 hover:border-white/20 transition-all duration-300">
                    <stat.icon className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                    <div className="text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Why Blitz Arena?
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Built for gamers, by gamers. Experience the future of competitive
              gaming.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 p-8 hover:border-white/20 transition-all duration-300 group h-full">
                  <motion.div
                    className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Tournaments */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-center mb-12"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Live Tournaments
                </span>
              </h2>
              <p className="text-xl text-gray-400">
                Join exciting competitions and win prizes
              </p>
            </div>
            <Link href="/tournaments">
              <Button
                variant="outline"
                className="text-white border-white/20 hover:border-white/40 hover:bg-white/10"
              >
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {upcomingTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        className={`${tournament.statusColor} text-white border-none`}
                      >
                        {tournament.status}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {tournament.startsIn}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {tournament.title}
                    </h3>
                    <p className="text-gray-400 mb-4">{tournament.game}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-semibold">
                          {tournament.prize} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{tournament.players}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 md:p-20 text-center"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Compete?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of players competing in tournaments worldwide.
                Your next victory is just a click away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6 rounded-xl"
                  >
                    Create Your Tournament
                  </Button>
                </Link>
                <Link href="/tournaments">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-white border-white/30 hover:border-white/50 hover:bg-white/10 text-lg px-8 py-6 rounded-xl"
                  >
                    Find Matches
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
