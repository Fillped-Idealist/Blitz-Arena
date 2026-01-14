"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  Sparkles,
  Trophy,
  Clock,
  Users,
  DollarSign,
  Info,
  Calendar,
  Timer,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { createTournament } from "@/lib/tournamentStore";

const GAME_TYPES = [
  {
    value: "1",
    label: "Number Guess",
    icon: "🔢",
    description: "Guess a number between 1-100 with minimum attempts"
  },
  {
    value: "2",
    label: "Rock Paper Scissors",
    icon: "✊✋✌️",
    description: "Battle AI in 10 rounds of rock-paper-scissors"
  },
  {
    value: "3",
    label: "Quick Click",
    icon: "🎯",
    description: "Click as many targets as possible within 30 seconds"
  },
  {
    value: "4",
    label: "Cycle Rift (轮回裂隙)",
    icon: "🌀",
    description: "Survive in the Cycle Rift, defeat endless monsters, upgrade skills, and survive as long as possible"
  },
  {
    value: "5",
    label: "Infinite Match",
    icon: "🧩",
    description: "Match identical tiles through connected paths, challenge infinite levels"
  },
];

const PRIZE_DISTRIBUTION = [
  { value: "0", label: "Winner Takes All", description: "100% of prize pool goes to 1st place" },
  { value: "1", label: "Average Split", description: "Prize pool divided equally among all participants" },
  { value: "2", label: "Top 3 Ranked", description: "60% / 30% / 10% distribution" },
];

const TIME_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "1 day", value: 1440 },
  { label: "2 days", value: 2880 },
  { label: "3 days", value: 4320 },
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    gameType: "",
    entryFee: "5",
    prizePool: "200",
    minPlayers: 2,
    maxPlayers: 32,
    distributionType: "0",
    registrationDuration: 60,
    gameDuration: 120,
    startImmediately: false,
  });

  const [selectedTimePreset, setSelectedTimePreset] = useState(60);
  const [selectedGamePreset, setSelectedGamePreset] = useState("");

  // Only render time-dependent content after mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a tournament title");
      return;
    }
    if (!formData.gameType) {
      toast.error("Please select a game type");
      return;
    }
    if (formData.minPlayers > formData.maxPlayers) {
      toast.error("Minimum players cannot exceed maximum players");
      return;
    }

    // 验证创建者奖池是否满足要求：必须大于 (报名费 × 最大人数) / 2
    const minimumCreatorPrize = (parseFloat(formData.entryFee) * formData.maxPlayers) / 2;
    if (parseFloat(formData.prizePool) <= minimumCreatorPrize) {
      toast.error(`Creator prize pool must be greater than ${minimumCreatorPrize} tokens (Entry Fee × Max Players / 2)`);
      return;
    }

    setLoading(true);
    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create tournament with real storage
      createTournament({
        title: formData.title,
        description: formData.description,
        gameType: formData.gameType,
        entryFee: formData.entryFee,
        prizePool: formData.prizePool,
        minPlayers: formData.minPlayers,
        maxPlayers: formData.maxPlayers,
        distributionType: formData.distributionType,
        registrationDuration: formData.registrationDuration,
        gameDuration: formData.gameDuration,
        creatorAddress: address || '0xcreator',
        startImmediately: formData.startImmediately,
      });

      toast.success("Tournament created successfully!");
      router.push("/tournaments");
    } catch (error) {
      toast.error("Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = () => {
    if (!isMounted) return "";
    const now = new Date();
    const totalMinutes = formData.registrationDuration + formData.gameDuration;
    now.setMinutes(now.getMinutes() + totalMinutes);
    return now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Create Tournament
                </span>
              </h1>
              <p className="text-xl text-gray-400 mt-2">
                Set up your competition and attract players
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Info className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Basic Information</h2>
              </div>

              <div className="space-y-6">
                {/* Tournament Title */}
                <div>
                  <Label htmlFor="title" className="text-white">
                    Tournament Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Championship League 2024"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                {/* Game Type Selection */}
                <div>
                  <Label className="text-white">Select Game *</Label>
                  <p className="text-sm text-gray-400 mb-4">
                    Choose the blockchain game for this tournament
                  </p>
                  <div className="space-y-3">
                    {GAME_TYPES.map((type) => (
                      <motion.div
                        key={type.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          handleInputChange("gameType", type.value);
                          setSelectedGamePreset(type.value);
                        }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-300 p-4 ${
                            formData.gameType === type.value
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{type.icon}</div>
                            <div className="flex-1">
                              <div className="font-semibold text-white text-lg mb-1">
                                {type.label}
                              </div>
                              <div className={`text-sm ${
                                formData.gameType === type.value
                                  ? "text-blue-100"
                                  : "text-gray-400"
                              }`}>
                                {type.description}
                              </div>
                            </div>
                            {formData.gameType === type.value && (
                              <div className="text-green-400">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your tournament rules, format, and any special requirements..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="mt-2 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    rows={4}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Prize and Entry Fees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Prize and Entry Fees
                </h2>
              </div>

              <div className="space-y-6">
                {/* Entry Fee */}
                <div>
                  <Label htmlFor="entryFee" className="text-white">
                    Entry Fee (tokens)
                  </Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="0"
                    value={formData.entryFee}
                    onChange={(e) => handleInputChange("entryFee", e.target.value)}
                    className="mt-2 bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Amount each player must pay to join
                  </p>
                </div>

                {/* Creator Prize Pool */}
                <div>
                  <Label htmlFor="prizePool" className="text-white">
                    Creator Prize Pool (tokens)
                  </Label>
                  <Input
                    id="prizePool"
                    type="number"
                    min="0"
                    value={formData.prizePool}
                    onChange={(e) => handleInputChange("prizePool", e.target.value)}
                    className="mt-2 bg-white/5 border-white/10 text-white"
                  />
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400">
                        Creator adds prize pool to attract more players
                      </span>
                    </div>
                    {parseFloat(formData.prizePool) <= (parseFloat(formData.entryFee) * formData.maxPlayers) / 2 ? (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                          <div className="text-sm">
                            <div className="text-yellow-200 font-medium mb-1">
                              Minimum Required: {Math.ceil((parseFloat(formData.entryFee) * formData.maxPlayers) / 2)} tokens
                            </div>
                            <p className="text-yellow-300/80">
                              Creator prize pool must be greater than (Entry Fee × Max Players) / 2<br/>
                              Current: {formData.entryFee} × {formData.maxPlayers} ÷ 2 = {(parseFloat(formData.entryFee) * formData.maxPlayers / 2).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Requirement met! Your prize pool exceeds the minimum requirement.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prize Distribution */}
                <div>
                  <Label className="text-white">Prize Distribution</Label>
                  <Select
                    value={formData.distributionType}
                    onValueChange={(value) =>
                      handleInputChange("distributionType", value)
                    }
                  >
                    <SelectTrigger className="mt-2 h-12 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder={PRIZE_DISTRIBUTION.find(d => d.value === formData.distributionType)?.label || "Select distribution method"} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {PRIZE_DISTRIBUTION.map((dist) => (
                        <SelectItem
                          key={dist.value}
                          value={dist.value}
                          className="py-2 text-gray-300 focus:text-white focus:bg-white/10"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="font-medium text-base leading-tight">{dist.label}</div>
                            <div className="text-xs text-gray-400 leading-snug">
                              {dist.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Player Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Player Settings</h2>
              </div>

              <div className="space-y-8">
                {/* Minimum Players */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-white">Minimum Players</Label>
                    <Badge variant="outline" className="text-white">
                      {formData.minPlayers}
                    </Badge>
                  </div>
                  <Slider
                    value={[formData.minPlayers]}
                    onValueChange={([value]) =>
                      handleInputChange("minPlayers", value)
                    }
                    min={2}
                    max={64}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Minimum players required to start the tournament
                  </p>
                </div>

                {/* Maximum Players */}
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-white">Maximum Players</Label>
                    <Badge variant="outline" className="text-white">
                      {formData.maxPlayers}
                    </Badge>
                  </div>
                  <Slider
                    value={[formData.maxPlayers]}
                    onValueChange={([value]) =>
                      handleInputChange("maxPlayers", value)
                    }
                    min={formData.minPlayers}
                    max={256}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Maximum players allowed in the tournament
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Timing Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Timer className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Timing Settings</h2>
              </div>

              <div className="space-y-8">
                {/* Registration Duration */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white">Registration Duration</Label>
                    <Badge variant="outline" className="text-white">
                      {formData.registrationDuration} min
                    </Badge>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {TIME_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={
                          selectedTimePreset === preset.value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          handleInputChange("registrationDuration", preset.value);
                          setSelectedTimePreset(preset.value);
                          handleInputChange("startImmediately", false);
                        }}
                        className={
                          selectedTimePreset === preset.value
                            ? "bg-gradient-to-r from-blue-600 to-purple-600"
                            : "border-white/20 text-gray-300 hover:bg-white/10"
                        }
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  <Slider
                    value={[formData.registrationDuration]}
                    onValueChange={([value]) => {
                      handleInputChange("registrationDuration", value);
                      setSelectedTimePreset(value);
                      handleInputChange("startImmediately", false);
                    }}
                    min={15}
                    max={10080} // 1 week
                    step={15}
                    className="mt-2"
                    disabled={formData.startImmediately}
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    How long players can register for the tournament
                  </p>
                </div>

                {/* Start Immediately Option */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="startImmediately"
                      checked={formData.startImmediately}
                      onChange={(e) => {
                        handleInputChange("startImmediately", e.target.checked);
                        if (e.target.checked) {
                          setSelectedTimePreset(0);
                        }
                      }}
                      className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label htmlFor="startImmediately" className="text-white cursor-pointer">
                        Start Tournament Immediately
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Skip registration phase and start the tournament right away. Perfect for quick demos and instant play!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Game Duration */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white">Game Duration</Label>
                    <Badge variant="outline" className="text-white">
                      {formData.gameDuration} min
                    </Badge>
                  </div>
                  <Slider
                    value={[formData.gameDuration]}
                    onValueChange={([value]) =>
                      handleInputChange("gameDuration", value)
                    }
                    min={30}
                    max={2880} // 48 hours
                    step={30}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    How long the tournament will run
                  </p>
                </div>

                {/* Estimated End Time */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white mb-1">
                        Estimated End Time
                      </div>
                      <div className="text-sm text-gray-300">
                        {calculateEndTime()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Review Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border-green-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">Summary</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-white">{formData.entryFee} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="text-white">{formData.prizePool} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Players:</span>
                  <span className="text-white">
                    {formData.minPlayers} - {formData.maxPlayers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Fee:</span>
                  <span className="text-white">
                    {(parseInt(formData.prizePool) * 0.05).toFixed(0)} tokens
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4"
          >
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Tournament
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
