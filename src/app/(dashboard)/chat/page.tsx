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

import { MessageSquare, Users, AlertCircle } from "lucide-react";
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

  /* -------------------------------------------------------------------------- */
  /*                             LOADING / AUTH UI                              */
  /* -------------------------------------------------------------------------- */

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <MessageSquare className="w-14 h-14 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
          <p className="text-gray-600 mb-6">
            Please login to access your conversations.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">
            Could not load your conversations.
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r">
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
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center gap-2">
                  {otherUser ? (
                    <>
                      <div className="relative">
                        {/* User avatar */}
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {otherUser?.name?.charAt(0) ?? "U"}
                        </div>

                        {/* Online/offline dot */}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            presence[otherUser?.id]?.isOnline
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>

                      {/* User info */}
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-gray-800">
                          {otherUser?.name ?? "Unknown User"}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {formatLastSeen(
                            presence[otherUser?.id]?.lastSeen,
                            presence[otherUser?.id]?.isOnline
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    "Offline"
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {onlineUsers.length} online
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <ChatWindow conversationId={selectedConversation.id} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-4">
              <ChatInput conversationId={selectedConversation.id} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="w-20 h-20 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-500">
              Choose a chat from the sidebar to start messaging
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
