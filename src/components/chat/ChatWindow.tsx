"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

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
    refetchOnMountOrArgChange: true,
    skip: liveMessages.length > 0,
  });

  useMarkMessagesSeen(conversationId);

  // ✅ Merge messages: backend + live, remove duplicates
  const allMessages = useMemo(() => {
    const merged = [...apiMessages];

    liveMessages.forEach((liveMsg) => {
      const exists = apiMessages.some(
        (apiMsg) =>
          apiMsg.id === liveMsg.id ||
          (apiMsg.text === liveMsg.text &&
            new Date(apiMsg.createdAt).getTime() -
              new Date(liveMsg.createdAt).getTime() <
              1000)
      );

      if (!exists) {
        merged.push(liveMsg);
      }
    });

    return merged.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [apiMessages, liveMessages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    
    allMessages.forEach((message) => {
      const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  }, [allMessages]);

  // Scroll handling
  useEffect(() => {
    if (autoScroll && messagesEndRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [allMessages, isTyping, autoScroll]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
      setShowScrollButton(!isAtBottom && scrollHeight > clientHeight);
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
      setShowScrollButton(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "00:00";
    }
  };

  const formatGroupDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        return 'Today';
      } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">Loading Messages</h3>
          <p className="text-sm text-gray-500 mt-1">Fetching your conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-6">Unable to load messages. Please check your connection.</p>
          <button
            onClick={() => refetch()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10 hover:scale-105"
        >
          <div className="w-5 h-5 flex items-center justify-center">↓</div>
        </button>
      )}

      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-6 p-2 scroll-smooth"
        onScroll={handleScroll}
      >
        {Object.entries(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="text-4xl">💬</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Messages Yet</h3>
              <p className="text-gray-600 text-lg">Start the conversation by sending your first message!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, messages]) => (
            <div key={date} className="space-y-4">
              {/* Date Separator */}
              <div className="flex items-center justify-center my-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-blue-700">
                    {formatGroupDate(date)}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              {messages.map((message: Message) => {
                const isOwnMessage = message.sender?.id === currentUserId;
                const messageTime = formatMessageTime(message.createdAt);

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} px-2`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {message.sender?.name || "User"}
                          </span>
                          <span className="text-xs text-gray-500">{messageTime}</span>
                        </div>
                      )}

                      <p className="break-words leading-relaxed">{message.text}</p>

                      <div className={`flex justify-between items-center mt-3 ${isOwnMessage ? 'mt-2' : ''}`}>
                        {!isOwnMessage && (
                          <span className="text-xs text-gray-500">{messageTime}</span>
                        )}
                        
                        {isOwnMessage && (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs opacity-80">{messageTime}</span>
                            <div className="text-xs">
                              {message.seen ? (
                                <CheckCheck className="w-4 h-4 text-blue-200" />
                              ) : (
                                <Check className="w-4 h-4 text-blue-200" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start px-2">
            <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                </div>
                <span className="text-sm text-gray-500">typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}