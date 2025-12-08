"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGetConversationMessagesQuery } from "@/redux/api/chatApi";
import { useAppSelector } from "@/redux/store";
import { Message } from "@/types/chat";
import { format } from "date-fns";
import { Check, CheckCheck, RefreshCw } from "lucide-react";
import { useMarkMessagesSeen } from "./useMarkSeen";

interface ChatWindowProps {
  conversationId: string;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const { auth } = useAuth();
  const currentUserId = auth.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const liveMessages = useAppSelector(
    (state) => state.chat.liveMessages[conversationId] || []
  );
  const isTyping = useAppSelector(
    (state) => state.chat.typing[conversationId] || false
  );

  const {
    data: apiMessages = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useGetConversationMessagesQuery(conversationId, {
    skip: liveMessages.length > 0,
    refetchOnMountOrArgChange: true,
  });

  useMarkMessagesSeen(conversationId);

  const allMessages = liveMessages.length > 0 ? liveMessages : apiMessages

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [allMessages, isTyping, autoScroll]);

  // Handle manual scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin mb-2" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading messages</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with refresh button */}
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {allMessages.length} messages
          {liveMessages.length > 0 && ` (${liveMessages.length} new)`}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1 hover:bg-gray-200 rounded"
          title="Refresh messages"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto space-y-4 p-4"
        onScroll={handleScroll}
      >
        {allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          allMessages.map((message: Message) => {
            const isOwnMessage = message.sender.id === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {isOwnMessage ? "You" : message.sender.name || "User"}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="break-words">{message.text}</p>
                  <div className="flex justify-end mt-1">
                    {isOwnMessage && (
                      <div className="text-xs">
                        {message.seen ? (
                          <CheckCheck className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="fixed bottom-24 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
          >
            ↓
          </button>
        )}
      </div>
    </div>
  );
}
