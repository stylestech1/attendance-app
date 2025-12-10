"use client";
import { useState, useRef, useEffect } from "react";
import { useAddMessageMutation } from "@/redux/api/chatApi";
import { socketService } from "@/services/socketService";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Send, Smile, Paperclip, Mic } from "lucide-react";
import { useAppDispatch } from "@/redux/store";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/chat";
import { addLiveMessage } from "@/redux/features/chatSlice";

interface ChatInputProps {
  conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [addMessage, { isLoading }] = useAddMessageMutation();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socket = socketService.getSocket();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    try {
      const socket = socketService.getSocket();

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
      clearTypingIndicator();
      stopTyping();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("❌ Failed to send message:", error);
    }
  };

  const startTyping = () => {
    const socket = socketService.getSocket();
    if (!socket?.connected || !conversationId) {
      return;
    }

    socketService.emit(SOCKET_EVENTS.TYPING, { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (!socket?.connected || !conversationId) return;

    socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearTypingIndicator = () => {
    if (socket?.connected) {
      socket?.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTypingIndicator();
      stopTyping();
    };
  }, []);

  return (
    <div className="flex items-end gap-3">
      {/* Textarea Container */}
      <div className="flex-1 relative bg-white border border-gray-300 rounded-2xl shadow-inner overflow-hidden">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            const val = e.target.value;
            setMessage(val);

            if (val.trim() && conversationId && socket?.connected) {
              startTyping();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className="w-full py-4 px-5 pr-24 resize-none focus:outline-none text-gray-800 placeholder-gray-400 bg-transparent min-h-[56px] max-h-[120px]"
          rows={1}
          maxLength={500}
        />
        
        <div className="absolute right-4 bottom-3 flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">
            {message.length}/500
          </span>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || isLoading}
        className={`p-4 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
          message.trim()
            ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        } ${isLoading ? "opacity-50" : ""}`}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}