"use client";
import { useState, useRef, useEffect } from "react";
import { useAddMessageMutation } from "@/redux/api/chatApi";
import { socketService } from "@/services/socketService";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Send } from "lucide-react";
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
  // const dispatch = useAppDispatch();
  // const { auth } = useAuth();

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    // const messageText = message.trim();
    // const tempId = `temp-${Date.now()}`;

    try {
      // const tempMessage: Message = {
      //   id: tempId,
      //   text: messageText,
      //   conversationId,
      //   sender: {
      //     id: auth?.id || '',
      //   },
      //   createdAt: new Date().toISOString(),
      //   seen: false,
      //   isTemp: true,
      // };

      // dispatch(addLiveMessage(tempMessage));

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
    } catch (error) {
      console.error("❌ Failed to send message:", error);
    }
  };

  const startTyping = () => {
    const socket = socketService.getSocket();
    if (!socket?.connected || !conversationId) {
      console.log("⚠️ Socket not connected for typing");
      return;
    }

    console.log("✍️ Emitting typing:", conversationId);
    socketService.emit(SOCKET_EVENTS.TYPING, { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (!socket?.connected || !conversationId) return;

    socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
    console.log("🤚 Emitting stopTyping:", conversationId);

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

  // const handleTyping = () => {
  //   if (!socket?.connected) {
  //     console.log("⚠️ Socket not connected, cannot emit typing");
  //     return;
  //   }

  //   // Emit typing event
  //   socket?.emit(SOCKET_EVENTS.TYPING, { conversationId });
  //   console.log("✍️ Emitting typing event for:", conversationId);

  //   // Clear previous timeout
  //   if (typingTimeoutRef.current) {
  //     clearTimeout(typingTimeoutRef.current);
  //   }

  //   // Set timeout to stop typing
  //   typingTimeoutRef.current = setTimeout(() => {
  //     socket?.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
  //     console.log("🤚 Emitting stop typing for:", conversationId);
  //   }, 2000);
  // };

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
    <div className="flex items-center gap-2">
      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => {
            const val = e.target.value;
            setMessage(val);

            if (val.trim() && conversationId && socket?.connected) {
              startTyping();
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
