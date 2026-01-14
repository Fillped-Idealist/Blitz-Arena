"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  MessageSquare,
  Users,
  Trophy,
  ArrowLeft,
  Send,
  Search,
  Hash,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { UserCard } from "@/components/UserCard";
import {
  getUserFriends,
  sendFriendRequest,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/lib/socialStore";
import {
  getAllTournaments,
  Tournament,
} from "@/lib/tournamentStore";
import {
  getConversation,
  sendMessage,
  markMessagesAsRead,
  getAllMessages,
  getInbox,
  getUnreadMessages,
  getTournamentMessages,
  sendTournamentMessage,
  tournamentChatExists,
  createTournamentChat,
  cleanupOldTournamentChats,
} from "@/lib/socialStore";

export default function ChatPage() {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'friends' | 'tournament'>('friends');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  // Data State
  const [friends, setFriends] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [conversation, setConversation] = useState<any[]>([]);
  const [tournamentMessages, setTournamentMessages] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendAddress, setNewFriendAddress] = useState("");
  const [showUserCard, setShowUserCard] = useState(false);
  const [selectedUserAddress, setSelectedUserAddress] = useState<string | null>(null);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (address) {
      loadData();
      // 定期清理过期聊天室
      cleanupOldTournamentChats();
    }
  }, [address]);

  // 当切换选择时加载消息
  useEffect(() => {
    if (selectedFriend) {
      const msgs = getConversation(address!, selectedFriend);
      setConversation(msgs);
      markMessagesAsRead(address!, selectedFriend);
      scrollToBottom();
    }
  }, [selectedFriend, address]);

  useEffect(() => {
    if (selectedTournament) {
      const msgs = getTournamentMessages(selectedTournament);
      setTournamentMessages(msgs);
      scrollToBottom();
    }
  }, [selectedTournament]);

  // 定期刷新消息
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedFriend) {
        const msgs = getConversation(address!, selectedFriend);
        setConversation(msgs);
      }
      if (selectedTournament) {
        const msgs = getTournamentMessages(selectedTournament);
        setTournamentMessages(msgs);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedFriend, selectedTournament, address]);

  const loadData = () => {
    setFriends(getUserFriends(address!));
    setTournaments(getAllTournaments());
    setPendingRequests(getPendingFriendRequests(address!));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendFriendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    sendMessage(address!, selectedFriend, newMessage);
    setNewMessage("");

    // 重新加载对话
    const msgs = getConversation(address!, selectedFriend);
    setConversation(msgs);
    scrollToBottom();
  };

  const handleSendTournamentMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTournament) return;

    sendTournamentMessage(address!, selectedTournament, newMessage);
    setNewMessage("");

    // 重新加载消息
    const msgs = getTournamentMessages(selectedTournament);
    setTournamentMessages(msgs);
    scrollToBottom();
  };

  const getFriendAddress = (friend: any): string => {
    return friend.requester === address ? friend.accepter : friend.requester;
  };

  const getUnreadCount = (friendAddress: string): number => {
    const unread = getUnreadMessages(address!);
    return unread.filter(m => m.fromAddress === friendAddress).length;
  };

  const getTournamentStatus = (tournament: Tournament): string => {
    const now = Date.now();
    const startTime = Date.now() + tournament.startTimeOffset * 60 * 1000;
    const endTime = startTime + tournament.duration * 60 * 1000;

    if (tournament.status === 'Canceled') return 'Canceled';
    if (tournament.status === 'Ended') return 'Completed';
    if (now < startTime) return 'Upcoming';
    if (now < endTime) return 'Live';
    return 'Ended';
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendAddress.trim()) return;

    if (newFriendAddress === address) {
      toast.error("You cannot add yourself as a friend");
      return;
    }

    sendFriendRequest(address!, newFriendAddress);
    toast.success("Friend request sent!");
    setNewFriendAddress("");
    setShowAddFriendModal(false);
  };

  const handleAddressClick = (addr: string) => {
    setSelectedUserAddress(addr);
    setShowUserCard(true);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="bg-white/5 border-white/10 p-12">
              <MessageSquare className="w-20 h-20 text-gray-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-8">
                Please connect your wallet to access chat rooms
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

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
          <Link href="/tournaments">
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Chat Hub
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Connect with friends and fellow players
          </p>
        </motion.div>

        {/* Main Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Sidebar - Chat List */}
          <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 lg:col-span-1 overflow-hidden flex flex-col h-[700px]">
            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'friends'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Friends
                </button>
                <button
                  onClick={() => setActiveTab('tournament')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'tournament'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Tournament Chats
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-10"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'friends' ? (
                <div className="p-2">
                  {/* Add Friend Button */}
                  <div className="mb-2 px-2">
                    <Button
                      onClick={() => setShowAddFriendModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>

                  {/* Friend Requests */}
                  {pendingRequests.length > 0 && (
                    <div className="mb-4 px-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">
                          Friend Requests ({pendingRequests.length})
                        </span>
                        <button
                          onClick={() => setShowFriendRequests(!showFriendRequests)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          {showFriendRequests ? 'Hide' : 'Show'}
                        </button>
                      </div>

                      {showFriendRequests && (
                        <div className="space-y-2">
                          {pendingRequests.map((request) => (
                            <div
                              key={request.id}
                              className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm text-white">
                                    {request.requester.slice(0, 6)}...{request.requester.slice(-4)}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      acceptFriendRequest(request.id);
                                      loadData();
                                    }}
                                    className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white border-none"
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      rejectFriendRequest(request.id);
                                      loadData();
                                    }}
                                    className="h-7 px-2 text-red-400 hover:text-red-300"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {friends.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">No friends yet</p>
                      <Button
                        onClick={() => setShowAddFriendModal(true)}
                        variant="ghost"
                        className="text-blue-400 mt-2"
                      >
                        Add Your First Friend
                      </Button>
                    </div>
                  ) : (
                    friends
                      .filter(friend => {
                        const friendAddr = getFriendAddress(friend);
                        return friendAddr.toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .map((friend) => {
                        const friendAddr = getFriendAddress(friend);
                        const unread = getUnreadCount(friendAddr);
                        return (
                          <button
                            key={friend.id}
                            onClick={() => {
                              setSelectedFriend(friendAddr);
                              setSelectedTournament(null);
                            }}
                            className={`w-full p-4 rounded-lg text-left transition-colors ${
                              selectedFriend === friendAddr
                                ? 'bg-blue-500/20 border border-blue-500/30'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-white text-sm truncate">
                                    {friendAddr.slice(0, 6)}...{friendAddr.slice(-4)}
                                  </span>
                                  {unread > 0 && (
                                    <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                                      {unread}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                  Friend since {new Date(friend.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              ) : (
                <div className="p-2">
                  {tournaments.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">No tournaments yet</p>
                    </div>
                  ) : (
                    tournaments
                      .filter(t =>
                        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.status.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((tournament) => {
                        const status = getTournamentStatus(tournament);
                        const statusColor =
                          status === 'Live' ? 'bg-green-500/20 text-green-400' :
                          status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' :
                          status === 'Completed' || status === 'Ended' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-red-500/20 text-red-400';

                        return (
                          <button
                            key={tournament.id}
                            onClick={() => {
                              setSelectedTournament(tournament.id);
                              setSelectedFriend(null);

                              // 如果聊天室不存在，创建它
                              if (!tournamentChatExists(tournament.id)) {
                                createTournamentChat(tournament.id);
                              }
                            }}
                            className={`w-full p-4 rounded-lg text-left transition-colors ${
                              selectedTournament === tournament.id
                                ? 'bg-purple-500/20 border border-purple-500/30'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Trophy className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-white text-sm truncate">
                                    {tournament.title}
                                  </span>
                                  <Badge className={`${statusColor} text-xs border-none`}>
                                    {status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                  {tournament.currentPlayers} players
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Main Chat Area */}
          <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border-white/10 lg:col-span-2 overflow-hidden flex flex-col h-[700px]">
            {!selectedFriend && !selectedTournament ? (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Select a Chat</h3>
                <p className="text-gray-400 text-center">
                  Choose a friend or tournament from the sidebar to start chatting
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="border-b border-white/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      {selectedFriend ? (
                        <Users className="w-5 h-5 text-white" />
                      ) : (
                        <Trophy className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        {selectedFriend
                          ? `${selectedFriend.slice(0, 6)}...${selectedFriend.slice(-4)}`
                          : tournaments.find(t => t.id === selectedTournament)?.title
                        }
                      </h3>
                      <p className="text-xs text-gray-400">
                        {selectedFriend
                          ? 'Direct Message'
                          : tournaments.find(t => t.id === selectedTournament)
                            ? `Tournament Chat - ${getTournamentStatus(tournaments.find(t => t.id === selectedTournament)!)}`
                            : 'Tournament Chat'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedFriend && conversation.map((msg) => {
                    const isOwn = msg.fromAddress === address;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              isOwn
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                            {formatTimestamp(msg.timestamp)}
                            {isOwn && msg.read && <span className="text-green-400">✓</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {selectedTournament && tournamentMessages.map((msg) => {
                    const isOwn = msg.fromAddress === address;
                    const isSystem = msg.fromAddress === '0x0000000000000000000000000000000000000000';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                          {isSystem ? (
                            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                              <p className="text-sm text-purple-300 text-center italic">{msg.content}</p>
                            </div>
                          ) : (
                            <>
                              <div className="text-xs text-gray-500 mb-1 ml-1">
                                <button
                                  onClick={() => handleAddressClick(msg.fromAddress)}
                                  className="hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                  {msg.fromAddress.slice(0, 6)}...{msg.fromAddress.slice(-4)}
                                </button>
                              </div>
                              <div
                                className={`rounded-lg p-3 ${
                                  isOwn
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'bg-white/10 text-white'
                                }`}
                              >
                                <p className="text-sm break-words">{msg.content}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                                {formatTimestamp(msg.timestamp)}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-white/10 p-4">
                  <form
                    onSubmit={selectedFriend ? handleSendFriendMessage : handleSendTournamentMessage}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 px-6"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </motion.div>

        {/* Add Friend Modal */}
        {showAddFriendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Add Friend</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddFriendModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleAddFriend} className="space-y-4">
                <div>
                  <Label className="text-white">Friend's Wallet Address</Label>
                  <Input
                    placeholder="0x..."
                    value={newFriendAddress}
                    onChange={(e) => setNewFriendAddress(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddFriendModal(false)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none"
                    disabled={!newFriendAddress.trim()}
                  >
                    Send Request
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* User Card Modal */}
        {selectedUserAddress && (
          <UserCard
            isOpen={showUserCard}
            onClose={() => setShowUserCard(false)}
            userAddress={selectedUserAddress}
          />
        )}
      </div>
    </div>
  );
}
