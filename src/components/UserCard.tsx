"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Heart,
  User,
  Trophy,
  ExternalLink,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getProfileLikes,
  hasLiked,
  likeProfile,
} from "@/lib/socialStore";
import { getUserStats } from "@/lib/tournamentStore";

interface UserCardProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
}

export function UserCard({ isOpen, onClose, userAddress }: UserCardProps) {
  const { address: currentUserAddress } = useAccount();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    totalPrizes: 0,
    wins: 0,
    averageScore: 0,
  });

  // Load data when modal opens
  useState(() => {
    if (isOpen && userAddress) {
      setLikes(getProfileLikes(userAddress));
      setLiked(hasLiked(currentUserAddress || "", userAddress));
      setStats(getUserStats(userAddress));
    }
  });

  const handleLike = () => {
    if (!currentUserAddress) {
      alert("Please connect your wallet first");
      return;
    }

    if (currentUserAddress === userAddress) {
      alert("You cannot like your own profile");
      return;
    }

    const newLiked = !liked;
    likeProfile(currentUserAddress, userAddress);
    setLiked(newLiked);
    setLikes(newLiked ? likes + 1 : likes - 1);
  };

  const handleViewProfile = () => {
    onClose();
    router.push(`/profile?address=${userAddress}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Trophy className="w-4 h-4" />
              <span>{stats.totalTournaments} Tournaments</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white/5 border-white/10 p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalTournaments}</div>
            <div className="text-xs text-gray-400">Games</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {stats.totalTournaments > 0
                ? Math.round((stats.wins / stats.totalTournaments) * 100)
                : 0}%
            </div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {stats.totalPrizes > 0 ? stats.totalPrizes.toFixed(1) : 0}
            </div>
            <div className="text-xs text-gray-400">Prizes</div>
          </Card>
        </div>

        {/* Like Section */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Heart
                className={`w-5 h-5 transition-colors ${
                  liked ? "fill-red-500 text-red-500" : "text-gray-400"
                }`}
              />
              <span className="text-white font-medium">{likes} Likes</span>
            </div>
          </div>
          <Button
            onClick={handleLike}
            variant="outline"
            size="sm"
            className={`border-white/20 hover:bg-white/10 ${
              liked ? "bg-red-500/20 border-red-500/50 text-red-400" : "text-white"
            }`}
            disabled={!currentUserAddress || currentUserAddress === userAddress}
          >
            {liked ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Liked
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Like
              </>
            )}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleViewProfile}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Profile
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
