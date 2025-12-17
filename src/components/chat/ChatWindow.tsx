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

  useMarkMessagesSeen(conversationId);

  const isOtherTyping = useMemo(() => {
    if(!conversationId) return false
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

  // الحصول على اسم المستخدم الآخر من الرسائل
  const otherUserName = useMemo(() => {
    // ابحث عن أول رسالة ليست من المستخدم الحالي
    const otherMessage = allMessages.find(
      (msg) => msg.sender?.id !== currentUserId
    );
    return otherMessage?.sender?.name || "User";
  }, [allMessages, currentUserId]);

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
      <div className="flex items-center justify-center h-full">
        Loading Messages...
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">Failed to load messages</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );

  return (
    <div className="h-full flex flex-col relative">
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
        >
          ↓
        </button>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-6 p-2 scroll-smooth"
        onScroll={handleScroll}
      >
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center justify-center my-6">
              <div className="bg-blue-100 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold text-blue-700">
                  {formatGroupDate(date)}
                </span>
              </div>
            </div>

            {messages.map((message: Message) => {
              const isOwnMessage = message.sender?.id === currentUserId;
              const messageTime = formatMessageTime(message.createdAt);

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  } px-2`}
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
                        <span className="text-xs text-gray-500">
                          {messageTime}
                        </span>
                      </div>
                    )}

                    <p className="break-words leading-relaxed whitespace-pre-wrap" dir="auto">
                      {message.text}
                    </p>

                    {isOwnMessage && (
                      <div className="flex items-center gap-2 mt-2 ml-auto text-xs opacity-80">
                        <span>{messageTime}</span>
                        {message.seen ? (
                          <CheckCheck className="w-4 h-4 text-blue-200" />
                        ) : (
                          <Check className="w-4 h-4 text-blue-200" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {isOtherTyping && (
          <div className="flex justify-start px-2">
            <div className="max-w-[70%] bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}