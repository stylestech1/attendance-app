"use client";
import { useState, useRef, useEffect } from "react";
import { useAddMessageMutation } from "@/redux/api/chatApi";
import { socketService } from "@/services/socketService";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Send, Smile, Paperclip } from "lucide-react";

interface ChatInputProps {
  conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [addMessage, { isLoading }] = useAddMessageMutation();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socket = socketService.getSocket();

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    try {
      console.log("📤 Sending message:", message.trim());
      const result = await addMessage({
        conversationId,
        text: message.trim(),
      }).unwrap();
      
      console.log("✅ Message sent successfully:", result);
      setMessage("");
      clearTypingIndicator();
      
      // Emit message sent event via socket
      socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        conversationId,
        message: result,
      });
    } catch (error) {
      console.error("❌ Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (!socket?.connected) {
      console.log("⚠️ Socket not connected, cannot emit typing");
      return;
    }

    // Emit typing event
    socket?.emit(SOCKET_EVENTS.TYPING, { conversationId });
    console.log("✍️ Emitting typing event for:", conversationId);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
      console.log("🤚 Emitting stop typing for:", conversationId);
    }, 2000);
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
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Attachment Button */}
      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
        <Paperclip className="w-5 h-5 text-gray-500" />
      </button>

      {/* Emoji Button */}
      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
        <Smile className="w-5 h-5 text-gray-500" />
      </button>

      {/* Message Input */}
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => {
            const newValue = e.target.value;
            setMessage(newValue);
            
            // Only emit typing if there's text and socket is connected
            if (newValue.trim() && socket?.connected) {
              handleTyping();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full border rounded-2xl py-3 px-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          maxLength={500}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
          {message.length}/500
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || isLoading}
        className={`p-3 rounded-full transition-colors flex items-center justify-center ${
          message.trim()
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        } ${isLoading ? "opacity-50" : ""}`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}