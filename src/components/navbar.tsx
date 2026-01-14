"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Users, Zap, Gamepad2, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/create", label: "Create Game", icon: Zap },
    { href: "/leaderboard", label: "Leaderboard", icon: Users },
    { href: "/docs", label: "Docs", icon: BookOpen },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2.5 rounded-xl">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Game Arena
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Connect Button */}
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
