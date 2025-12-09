"use client";
import { useAuth } from "@/context/AuthContext";
import {
  useCreateOrGetConversationMutation,
  useGetAllUserQuery,
} from "@/redux/api/chatApi";
import { RootState, useAppSelector } from "@/redux/store";
import { useChatSocket } from "@/services/useChatSocket";
import { Conversation } from "@/types/chat";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  MessageSquare,
  Users,
  LogOut,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export default function ChatSidebar({
  conversations,
  selectedConvId,
  onSelectConversation,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"conversations" | "users">(
    "conversations"
  );
  const router = useRouter();
  const { auth } = useAuth();
  const onlineUsers = useAppSelector(
    (state: RootState) => state.chat.onlineUsers
  );
  const { getPresenceList } = useChatSocket();

  useEffect(() => {
    if (getPresenceList) {
      getPresenceList();
    }
  }, [getPresenceList]);

  // API Hooks
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUserQuery();
  const [createConversation] = useCreateOrGetConversationMutation();

  const conversationsArray = Array.isArray(conversations) ? conversations : [];

  // Filter Conversation

  const filteredConversations = conversationsArray.filter((conv) =>
    conv.members.some((member) =>
      member.name?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // Filter users (exclude current user)
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return user.id !== auth.id && matchesSearch;
  });

  // Is Online
  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  // Start new conversation with user
  const handleStartNewChat = async (userId: string) => {
    try {
      const result = await createConversation({ userId }).unwrap();
      onSelectConversation(result.id);
      setActiveTab("conversations");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Check if user already has conversation
  const hasConversationWithUser = (userId: string) => {
    return conversationsArray.some((conv) =>
      conv.members.some((member) => member.id === userId)
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-start justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Messages
        </h1>

        <button
          onClick={router.back}
          className="cursor-pointer p-2 rounded-full hover:bg-blue-300 transition-colors duration-200"
        >
          <LogOut />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === "conversations"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("conversations")}
        >
          <MessageCircle className="w-4 h-4" />
          Conversations ({conversationsArray.length})
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("users")}
        >
          <Users className="w-4 h-4" />
          All Users ({allUsers.length})
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${
              activeTab === "conversations" ? "conversations..." : "users..."
            }`}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "conversations" ? (
          // CONVERSATIONS TAB
          conversationsArray.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium mb-2">No conversations yet</h3>
              <p className="text-sm mb-4">
                Start a conversation with your team members
              </p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setActiveTab("users")}
              >
                Find People
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No matching conversations</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherMember = conversation.members.find(
                (m) => m.id !== auth.id
              );
              const isSelected = selectedConvId === conversation.id;
              const isOtherUserOnline = otherMember
                ? isUserOnline(otherMember.id)
                : false;

              return (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {otherMember?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        {/* Online */}
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isOtherUserOnline ? "bg-green-500" : "bg-gray-400"
                          }`}
                          title={
                            isOtherUserOnline
                              ? `Online (Last seen: ${new Date().toLocaleTimeString()})`
                              : "Offline"
                          }
                        ></div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherMember?.name || "Unknown User"}
                          </h3>
                          {conversation.updatedAt && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatDistanceToNow(
                                new Date(conversation.updatedAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          )}
                        </div>

                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage.text || "📎 Attachment"}
                          </p>
                        )}

                        {/* Unread indicator */}
                        {/* {!conversation.lastMessage?.seen && (
                          <div className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full mt-1">
                            {conversation.unreadCount}
                          </div>
                        )} */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : // USERS TAB
        usersLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-medium mb-2">No users found</h3>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const hasExistingChat = hasConversationWithUser(user.id);
            const isOnline = isUserOnline(user.id);

            return (
              <div
                key={user.id}
                className="p-4 border-b hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      {/* Online */}
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                        title={isOnline ? "Online" : "Offline"}
                      ></div>
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate max-w-[150px]">
                        {user.position} • {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartNewChat(user.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                      hasExistingChat
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {hasExistingChat ? (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Open Chat
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Message
                      </>
                    )}
                  </button>
                </div>

                {/* User Details */}
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>📞 {user.phone}</span>
                    <span>👔 Job #{user.jobId}</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        user.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Current User Info */}
      {/* <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {auth.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">{auth.name || "User"}</p>
              <p className="text-xs text-gray-500 capitalize">{auth.role}</p>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            true ? "bg-green-500" : "bg-gray-400"
          }`}></div>
        </div>
      </div> */}
    </div>
  );
}
