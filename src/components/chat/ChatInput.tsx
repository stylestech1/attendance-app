"use client";

import { useState, useRef, useEffect } from "react";
import { useAddMessageMutation } from "@/redux/api/chatApi";
import { socketService } from "@/services/socketService";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Send, Image, Mic, Smile, Paperclip, Clock } from "lucide-react";
import { useAppDispatch } from "@/redux/store";
import { setTyping as setTypingLocal } from "@/redux/features/chatSlice";

interface ChatInputProps {
  conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [addMessage, { isLoading }] = useAddMessageMutation();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();

  const socket = socketService.getSocket();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    try {
      if (socket?.connected) {
        socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
          conversationId,
          text: message.trim(),
        });
      } else {
        await addMessage({
          conversationId,
          text: message.trim(),
        }).unwrap();
      }

      setMessage("");
      stopTyping();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      console.error("❌ Failed to send message:", error);
    }
  };

  // Start typing
  const startTyping = () => {
    if (!conversationId || !socket?.connected) return;

    socket.emit(SOCKET_EVENTS.TYPING, { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  // Stop typing
  const stopTyping = () => {
    if (!conversationId || !socket?.connected) return;

    socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;

    if (e.shiftKey) {
      e.preventDefault();

      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue = message.slice(0, start) + "\n" + message.slice(end);

      setMessage(newValue);

      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      });

      return;
    }

    e.preventDefault();
    handleSend();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          120
        )}px`;
      }
    });

    if (e.target.value.trim()) startTyping();
    else stopTyping();
  };

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, []);

  return (
    <div className="mx-auto p-3 border-t border-gray-100">
      {/* Input area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 blur-lg rounded-2xl"></div>
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:border-blue-300 transition-all duration-300">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="w-full py-4 px-5 pr-32 resize-none focus:outline-none text-gray-800 placeholder-gray-500 bg-transparent min-h-[60px] max-h-[120px] overflow-y-auto text-[15px] leading-relaxed"
              rows={1}
            />
            <div className="absolute right-4 bottom-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">
                  {message.length}/2000
                </span>
              </div>
              {isLoading && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={`relative p-5 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            message.trim()
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed shadow-sm"
          } ${isLoading ? "opacity-70" : ""}`}
        >
          {message.trim() && !isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-2xl animate-pulse"></div>
          )}
          <div className="relative">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
