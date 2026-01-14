// 简单的合约测试页面
"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { useGameFactory } from "@/hooks/useGameContract";

export default function TestContractPage() {
  const { address, isConnected } = useAccount();
  const { allGames, totalGames, refetchGames } = useGameFactory();

  const handleRefetch = () => {
    refetchGames();
    toast.success("Data refreshed!");
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-8">Smart Contract Test</h1>

          <div className="space-y-6">
            {/* Wallet Status */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4">Wallet Status</h2>
              <div className="space-y-2">
                <p className="text-gray-400">
                  Connected: <span className={isConnected ? "text-green-400" : "text-red-400"}>
                    {isConnected ? "Yes" : "No"}
                  </span>
                </p>
                {address && (
                  <p className="text-gray-400">
                    Address: <span className="text-white font-mono">{address}</span>
                  </p>
                )}
              </div>
            </Card>

            {/* Contract Data */}
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Contract Data</h2>
                <Button onClick={handleRefetch} size="sm">
                  Refresh
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">
                  Total Games: <span className="text-white font-bold">{totalGames?.toString() || "0"}</span>
                </p>
                <p className="text-gray-400">
                  Game Addresses: <span className="text-white font-bold">{allGames?.length || 0}</span>
                </p>
                {allGames && allGames.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-gray-400 font-bold">Game Addresses:</p>
                    {allGames.map((addr, index) => (
                      <p key={index} className="text-gray-400 font-mono text-sm">
                        {index + 1}. {addr}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Test Instructions */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4">Test Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-400">
                <li>Ensure Hardhat node is running on port 8545</li>
                <li>Connect your wallet to Hardhat network</li>
                <li>Click "Refresh" to load contract data</li>
                <li>Create a tournament to test contract interaction</li>
              </ol>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
