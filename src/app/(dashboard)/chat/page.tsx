"use client";
import { useAuth } from "@/context/AuthContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import { useGetUserConversationsQuery } from "@/redux/api/chatApi";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setSelectedConversation } from "@/redux/features/chatSlice";
import { useEffect } from "react";
import SocketStatus from "@/components/chat/SocketStatus";

export default function ChatPage() {
  const { isAuthenticated, loading: authLoading, auth } = useAuth();
  const dispatch = useAppDispatch();
  
  const { 
    data: conversations = [], 
    isLoading, 
    error,
    refetch 
  } = useGetUserConversationsQuery(undefined, {
    skip: !isAuthenticated,
  });

  console.log('conversations ==', conversations)
  
  const selectedConvId = useAppSelector((state) => state.chat.selectedConversationId);

  // Refetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Refetching conversations...");
      refetch();
    }
  }, [isAuthenticated, refetch]);

  const selectedConversation = conversations.find(conv => conv.id === selectedConvId);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Please login to access chat</div>
      </div>
    );
  }

  if (error) {
    console.error("Chat Error:", error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">
          Error loading conversations. Please try again.
        </div>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SocketStatus />
      {/* Sidebar */}
      <div className="w-1/4 border-r bg-white">
        <ChatSidebar 
          conversations={conversations} 
          selectedConvId={selectedConvId}
          onSelectConversation={(id) => {
            console.log("Selecting conversation:", id);
            dispatch(setSelectedConversation(id));
          }}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    {selectedConversation.members
                      ?.map(member => member.name || "Unknown")
                      .filter(Boolean)
                      .join(", ")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.members?.length || 0} participants
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Window */}
            <div className="flex-1 overflow-y-auto p-4">
              <ChatWindow conversationId={selectedConversation.id} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 bg-white">
              <ChatInput conversationId={selectedConversation.id} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-600">
                {conversations.length === 0 
                  ? "No conversations yet" 
                  : "Select a conversation"}
              </h3>
              <p className="text-gray-500">
                {conversations.length === 0
                  ? "Start a new conversation from your contacts"
                  : "Choose from the sidebar to start chatting"}
              </p>
              {conversations.length > 0 && (
                <button
                  onClick={() => {
                    // Select first conversation
                    const firstConv = conversations[0];
                    if (firstConv) {
                      console.log("Auto-selecting first conversation:", firstConv.id);
                      dispatch(setSelectedConversation(firstConv.id));
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Select First Conversation
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}