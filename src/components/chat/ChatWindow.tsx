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
  const currentUserId = auth.id ?? "";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const liveMessages = useAppSelector(
    (state) => state.chat.liveMessages[conversationId] || []
  );
  const typingState = useAppSelector((state) => state.chat.typing);

  const {
    data: apiMessages = [],
    isLoading,
    refetch,
    error,
  } = useGetConversationMessagesQuery(conversationId, {
    refetchOnMountOrArgChange: true,
    skip: liveMessages.length > 0,
  });

  const { markAsSeen } = useMarkMessagesSeen(conversationId);

  useEffect(() => {
    const handleScrollToBottom = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

        if (isAtBottom) {
          markAsSeen();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScrollToBottom);
      return () =>
        container.removeEventListener("scroll", handleScrollToBottom);
    }
  }, [markAsSeen]);

  const isOtherTyping = useMemo(() => {
    if (!conversationId) return false;
    return typingState[conversationId] || false;
  }, [typingState, conversationId]);

  const allMessages = useMemo(() => {
    const merged = [...apiMessages];
    liveMessages.forEach((liveMsg) => {
      const exists = apiMessages.some(
        (apiMsg) =>
          apiMsg.id === liveMsg.id ||
          (apiMsg.text === liveMsg.text &&
            Math.abs(
              new Date(apiMsg.createdAt).getTime() -
                new Date(liveMsg.createdAt).getTime()
            ) < 1000)
      );
      if (!exists) merged.push(liveMsg);
    });
    return merged.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [apiMessages, liveMessages]);

  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    allMessages.forEach((message) => {
      const date = format(new Date(message.createdAt), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  }, [allMessages]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [allMessages, isOtherTyping, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
    setShowScrollButton(!isAtBottom && scrollHeight > clientHeight);
  };

  const scrollToBottom = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    setAutoScroll(true);
    setShowScrollButton(false);
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a");
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
      if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
        return "Today";
      else if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd"))
        return "Yesterday";
      else return format(date, "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  if (isLoading)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-50/80 to-white">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-[6px] border-gray-100 border-t-blue-500 border-r-blue-400 border-b-blue-300 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-inner">
              <div className="w-8 h-8 text-blue-500 animate-pulse">💬</div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-gray-800">
            Loading Conversation
          </p>
          <p className="text-gray-600 max-w-sm">
            Fetching messages from the server...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-50/80 to-white px-6">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold text-gray-800">
            Connection Error
          </p>
          <p className="text-gray-600 max-w-sm">
            Unable to load messages. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Messages
          </button>
        </div>
      </div>
    );

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-b from-white to-gray-50/30">
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 z-10 flex items-center justify-center group"
        >
          <div className="w-6 h-6 transition-transform group-hover:-translate-y-1">
            ↓
          </div>
        </button>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-8 p-4 md:p-6 lg:p-8 scroll-smooth bg-blue-50"
        onScroll={handleScroll}
      >
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date} className="space-y-6">
            <div className="flex items-center justify-center my-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl rounded-full group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-gradient-to-r from-white to-gray-50 px-6 py-3.5 rounded-2xl border border-gray-200 shadow-lg backdrop-blur-sm">
                  <span className="text-sm font-semibold text-gray-700">
                    {formatGroupDate(date)}
                  </span>
                </div>
              </div>
            </div>

            {messages.map((message: Message) => {
              const isOwnMessage = message.sender?.id === currentUserId;
              const messageTime = formatMessageTime(message.createdAt);
              const senderInitial = message.sender?.name?.charAt(0) || "U";

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  } px-1 group`}
                >
                  <div className="max-w-[85%] md:max-w-[75%] lg:max-w-[65%]">
                    {!isOwnMessage && (
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md">
                          <span className="text-white text-sm font-bold">
                            {senderInitial}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {messageTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <div
                        className={`relative rounded-2xl px-5 py-4 shadow-lg ${
                          isOwnMessage
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-md"
                        } ${
                          message.seen && isOwnMessage
                            ? "ring-1 ring-blue-300"
                            : ""
                        }`}
                      >
                        <p
                          className="break-words leading-relaxed whitespace-pre-wrap pb-1 text-[15.5px]"
                          dir="auto"
                        >
                          {message.text}
                        </p>

                        <div
                          className={`flex items-center justify-between mt-3 ${
                            isOwnMessage
                              ? "pt-2 border-t border-blue-400/30"
                              : "pt-2 border-t border-gray-100"
                          }`}
                        >
                          <span
                            className={`text-xs ${
                              isOwnMessage ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {messageTime}
                          </span>

                          {isOwnMessage && (
                            <div className="flex items-center gap-1.5">
                              {message.seen ? (
                                <div className="flex items-center gap-1">
                                  <CheckCheck className="w-4 h-4 text-blue-200" />
                                  <span className="text-xs text-blue-200">
                                    Seen
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Check className="w-4 h-4 text-blue-200" />
                                  <span className="text-xs text-blue-200">
                                    Sent
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {isOtherTyping && (
          <div className="flex justify-start px-1">
            <div className="max-w-[85%] md:max-w-[75%] lg:max-w-[65%]">
              <div className="flex items-center gap-3 mb-2 ml-14">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md animate-pulse">
                  <div className="w-4 h-4 text-white">👤</div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-2 top-3 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 rounded-tl"></div>
                <div className="relative bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100 shadow-md px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      Typing...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-8" />
      </div>

      {allMessages.length === 0 && !isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-2xl">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center shadow-inner">
                  <div className="w-10 h-10 text-blue-500">💬</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">💬</span>
            </div>
          </div>
          <div className="text-center space-y-3 max-w-md">
            <p className="text-2xl font-bold text-gray-800">
              Start the Conversation
            </p>
            <p className="text-gray-600">
              No messages yet. Be the first to say hello and start chatting!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
