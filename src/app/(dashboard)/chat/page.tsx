"use client";
import { useAuth } from "@/context/AuthContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import { useGetUserConversationsQuery } from "@/redux/api/chatApi";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { setSelectedConversation } from "@/redux/features/chatSlice";
import { useEffect, useRef, useMemo } from "react";
import { useChatSocket } from "@/services/useChatSocket";
import { MessageSquare, Users, AlertCircle } from "lucide-react";

export default function ChatPage() {
  const { isAuthenticated, loading: authLoading, auth } = useAuth();
  const dispatch = useAppDispatch();
  const { isInitialized, joinConversation } = useChatSocket();
  
  // Online users from Redux store
  const onlineUsers = useAppSelector(
    (state: RootState) => state.chat.onlineUsers
  );

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useGetUserConversationsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  const selectedConvId = useAppSelector(
    (state) => state.chat.selectedConversationId
  );

  // Refetch on mount or login
  useEffect(() => {
    if (isAuthenticated) refetch();
  }, [isAuthenticated]);

  // Join selected conversation room
  const prevConvId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedConvId || selectedConvId === prevConvId.current) return;
    if (isInitialized.current) {
      joinConversation(selectedConvId);
      prevConvId.current = selectedConvId;
    }
  }, [selectedConvId, joinConversation, isInitialized]);

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConvId
  );

  // Get the other user in the conversation (not the current user)
  const otherUser = useMemo(() => {
    if (!selectedConversation || !auth?.id) return null;
    return selectedConversation.members.find((m) => m.id !== auth.id);
  }, [selectedConversation, auth?.id]);

  // Check if the other user is online
  const isOtherUserOnline = useMemo(() => {
    if (!otherUser?.id) return false;
    return onlineUsers.includes(otherUser.id);
  }, [otherUser?.id, onlineUsers]);

  // Calculate online status text and color
  const getOnlineStatus = () => {
    if (!otherUser) return { text: "Select a conversation", color: "gray", dotColor: "gray" };
    
    if (isOtherUserOnline) {
      return { 
        text: "Online", 
        color: "text-green-600", 
        dotColor: "bg-green-500",
        showIndicator: true
      };
    } else {
      return { 
        text: "Offline", 
        color: "text-gray-500", 
        dotColor: "bg-gray-400",
        showIndicator: false
      };
    }
  };

  const onlineStatus = getOnlineStatus();

  // ------------------ LOADING & AUTH STATES ------------------
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600 font-medium">
            Loading chat...
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Preparing your conversations
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-md w-full mx-4">
          <MessageSquare className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">
            Welcome to Chat
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Please login to access your conversations and connect with your
            team.
          </p>
          <a
            href="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-center"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-md w-full mx-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">
            Connection Error
          </h2>
          <p className="text-gray-600 text-center mb-6">
            We {`couldn't`} load your conversations. Please check your
            connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ------------------ RENDER CHAT UI ------------------
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white shadow-sm">
        <ChatSidebar
          conversations={conversations}
          selectedConvId={selectedConvId}
          onSelectConversation={(id) => dispatch(setSelectedConversation(id))}
          // onlineUsers={onlineUsers}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <span className="text-white font-semibold text-lg">
                        {otherUser?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    {onlineStatus.showIndicator && (
                      <div className={`absolute bottom-0 right-0 w-3 h-3 ${onlineStatus.dotColor} rounded-full border-2 border-white`}></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">
                      {otherUser?.name || "Unknown User"}
                    </h2>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${onlineStatus.color}`}>
                        {onlineStatus.text}
                      </p>
                      {!isOtherUserOnline && (
                        <span className="text-xs text-gray-400">
                          • Last seen recently
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Online users count indicator */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    <span className="font-medium">{onlineUsers.length}</span>
                    <span className="ml-1">online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Window */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50/50 p-6">
              <ChatWindow conversationId={selectedConversation.id} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-6 shadow-sm">
              <ChatInput conversationId={selectedConversation.id} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="max-w-md text-center">
              <div className="inline-block p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl mb-6 shadow-sm">
                {conversations.length === 0 ? (
                  <MessageSquare className="w-20 h-20 text-blue-400" />
                ) : (
                  <Users className="w-20 h-20 text-blue-400" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {conversations.length === 0
                  ? "Start Your First Conversation"
                  : "Welcome to Chat"}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {conversations.length === 0
                  ? "Connect with your team members and start collaborating"
                  : "Select a conversation from the sidebar to start chatting"}
              </p>
              
              {/* Online users info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-medium text-gray-700">
                    {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Real-time status updates
                </p>
              </div>
              
              {conversations.length > 0 && (
                <button
                  onClick={() => {
                    const firstConv = conversations[0];
                    if (firstConv)
                      dispatch(setSelectedConversation(firstConv.id));
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Open First Conversation
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}