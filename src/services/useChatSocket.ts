// services/useChatSocket.ts
"use client";
import {
  addLiveMessage,
  markMessageSeenLocal,
  setTyping,
  setUserOffline,
  setUserOnline,
  addConversationLocal,
} from "@/redux/features/chatSlice";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { socketService } from "./socketService";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Message, Conversation } from "@/types/chat";

export const useChatSocket = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state: RootState) => state.auth.token);
  const isInitialized = useRef(false);

  // Connect socket when token changes
  useEffect(() => {
    if (!token) {
      console.log("⏸️ No token, skipping socket connection");
      return;
    }

    const socket = socketService.initialize(token);

    const handleConnect = () => {
      console.log("✅ useChatSocket: Socket connected");
      isInitialized.current = true;

      // Join user to their room
      socket.emit("joinUser");
    };

    const handleDisconnect = () => {
      console.log("🔌 useChatSocket: Socket disconnected");
      isInitialized.current = false;
    };

    // 📩 New message
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg: Message) => {
      console.log("📨 New message received via socket:", msg);
      dispatch(addLiveMessage(msg));
    });

    // 👀 Message Seen
    socket.on(
      SOCKET_EVENTS.MARK_SEEN,
      ({ conversationId }: { conversationId: string }) => {
        console.log("👀 Message seen for conversation:", conversationId);
        dispatch(markMessageSeenLocal(conversationId));
      }
    );

    // ✍ Typing
    socket.on(
      SOCKET_EVENTS.TYPING,
      ({ conversationId }: { conversationId: string }) => {
        console.log("✍️ Typing in conversation:", conversationId);
        dispatch(setTyping({ conversationId, isTyping: true }));
      }
    );

    // 🤚 Stop Typing
    socket.on(
      SOCKET_EVENTS.STOP_TYPING,
      ({ conversationId }: { conversationId: string }) => {
        console.log("🤚 Stopped typing in conversation:", conversationId);
        dispatch(setTyping({ conversationId, isTyping: false }));
      }
    );

    // 🟢 User Online
    socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }: { userId: string }) => {
      console.log("🟢 User online:", userId);
      dispatch(setUserOnline({ userId }));
    });

    // 🔴 User Offline
    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }: { userId: string }) => {
      console.log("🔴 User offline:", userId);
      dispatch(setUserOffline({ userId }));
    });

    // 🔄 New conversation created
    socket.on("newConversation", (conversation: Conversation) => {
      console.log("🆕 New conversation via socket:", conversation);
      dispatch(addConversationLocal(conversation));
    });

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.MARK_SEEN);
      socket.off(SOCKET_EVENTS.TYPING);
      socket.off(SOCKET_EVENTS.STOP_TYPING);
      socket.off(SOCKET_EVENTS.USER_ONLINE);
      socket.off(SOCKET_EVENTS.USER_OFFLINE);
      socket.off("newConversation");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [dispatch, token]);

  return { isInitialized };
};
