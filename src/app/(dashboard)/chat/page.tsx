"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector, RootState } from "@/redux/store";
import { setSelectedConversation } from "@/redux/features/chatSlice";
import { useGetUserConversationsQuery } from "@/redux/api/chatApi";
import { useChatSocket } from "@/services/useChatSocket";
import { socketService } from "@/services/socketService";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";

import {
  MessageSquare,
  Users,
  AlertCircle,
  Wifi,
  WifiOff,
  MoreVertical,
  Phone,
  Video,
  Info,
  RefreshCw,
} from "lucide-react";
import { Conversation } from "@/types/chat";
import { formatLastSeen } from "@/utils/formatLastSeen";

export default function ChatPage() {
  const { isAuthenticated, loading: authLoading, auth } = useAuth();
  const dispatch = useAppDispatch();

  const { joinConversation } = useChatSocket();

  /* -------------------------------------------------------------------------- */
  /*                                   STATE                                    */
  /* -------------------------------------------------------------------------- */

  const onlineUsers = useAppSelector(
    (state: RootState) => state.chat.onlineUsers
  );

  const selectedConvId = useAppSelector(
    (state: RootState) => state.chat.selectedConversationId
  );

  const presence = useAppSelector((state: RootState) => state.chat.presence);

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useGetUserConversationsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  /* -------------------------------------------------------------------------- */
  /*                                SIDE EFFECTS                                */
  /* -------------------------------------------------------------------------- */

  // Refetch conversations on login
  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  // Join selected conversation room (safe with socket reconnect)
  const prevConvId = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedConvId) return;
    if (selectedConvId === prevConvId.current) return;

    if (!selectedConvId) return;

    if (socketService.isConnected()) {
      console.log("Joining conversation:", selectedConvId);
      joinConversation(selectedConvId);
      prevConvId.current = selectedConvId;
    }
  }, [selectedConvId, joinConversation]);

  /* -------------------------------------------------------------------------- */
  /*                               DERIVED DATA                                 */
  /* -------------------------------------------------------------------------- */

  const selectedConversation: Conversation | undefined = useMemo(
    () => conversations.find((c) => c.id === selectedConvId),
    [conversations, selectedConvId]
  );

  // Other user (1:1 chat only)
  const otherUser = useMemo(() => {
    if (!selectedConversation || !auth?.id) return null;
    return selectedConversation.members.find((m) => m.id !== auth.id) ?? null;
  }, [selectedConversation, auth?.id]);

  const isOtherUserOnline = otherUser
    ? presence[otherUser.id]?.isOnline
    : false;

  /* -------------------------------------------------------------------------- */
  /*                             LOADING / AUTH UI                              */
  /* -------------------------------------------------------------------------- */

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-blue-500 border-r-blue-400 animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
          <p className="text-gray-700 font-medium">
            Loading your conversations
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Preparing your chat experience...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md mx-4 border border-gray-100">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto shadow-lg">
              <MessageSquare className="w-12 h-12 text-blue-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-lg">💬</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Welcome to Chat
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Connect with your team and colleagues in real-time. Please login to
            access your conversations.
          </p>
          <a
            href="/login"
            className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md mx-4 border border-gray-100">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-lg">!</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Could not load your conversations. Please check your internet
            connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-3 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 shadow-lg">
        <ChatSidebar
          conversations={conversations}
          selectedConvId={selectedConvId}
          onSelectConversation={(id) => dispatch(setSelectedConversation(id))}
        />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-100 px-8 py-6.5 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                {otherUser ? (
                  <>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">
                          {otherUser?.name?.charAt(0) ?? "U"}
                        </span>
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-3 border-white shadow-sm ${
                          isOtherUserOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {otherUser?.name ?? "Unknown User"}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatLastSeen(
                          presence[otherUser?.id]?.lastSeen,
                          presence[otherUser?.id]?.isOnline
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        Group Chat
                      </h3>
                      <p className="text-sm text-gray-500">
                        Multiple participants
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50/50">
              <ChatWindow conversationId={selectedConversation.id} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 bg-white shadow-sm">
              <ChatInput conversationId={selectedConversation.id} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-2xl">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center shadow-inner">
                    <Users className="w-14 h-14 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">💬</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Welcome to Chat
            </h3>
            <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
              Select a conversation from the sidebar to start messaging. Connect
              with your colleagues and team members in real-time.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{onlineUsers.length} users online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{conversations.length} conversations</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
