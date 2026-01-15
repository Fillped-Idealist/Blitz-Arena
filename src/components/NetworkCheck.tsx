"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export function NetworkCheck() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // 支持的网络
  const supportedChains = [31337, 5003]; // Hardhat 和 Mantle Sepolia

  useEffect(() => {
    if (isConnected && !supportedChains.includes(chainId)) {
      toast.error("Unsupported Network", {
        description: (
          <div className="flex flex-col gap-2">
            <p>Please switch to a supported network:</p>
            <div className="flex gap-2">
              <button
                onClick={() => switchChain({ chainId: 5003 })}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm"
              >
                Mantle Sepolia (5003)
              </button>
              <button
                onClick={() => switchChain({ chainId: 31337 })}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded text-white text-sm"
              >
                Hardhat Local (31337)
              </button>
            </div>
          </div>
        ),
        duration: 10000,
      });
    }
  }, [isConnected, chainId, switchChain]);

  if (!isConnected) {
    return null;
  }

  const isSupported = supportedChains.includes(chainId);

  if (!isSupported) {
    return (
      <div className="fixed top-20 right-4 z-50 max-w-sm">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-400 mb-1">Unsupported Network</p>
            <p className="text-sm text-gray-300 mb-2">
              Please switch to Mantle Sepolia (5003) or Hardhat Local (31337)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => switchChain({ chainId: 5003 })}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm transition-colors"
              >
                Switch to Mantle Sepolia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
