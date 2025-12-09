"use client";
import {
  addLiveMessage,
  markMessageSeenLocal,
  setTyping,
  setUserOffline,
  setUserOnline,
  addConversationLocal,
  setOnlineUsers,
} from "@/redux/features/chatSlice";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { socketService } from "./socketService";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Message, Conversation } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";

export const useChatSocket = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state: RootState) => state.auth.token);
  const isInitialized = useRef(false);
  const { auth } = useAuth();

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
      socket.emit(SOCKET_EVENTS.USER_ONLINE, { userId: auth.id });
      socket.emit(SOCKET_EVENTS.PRESENCE_LIST, {});
    };

    const handleDisconnect = () => {
      console.log("🔌 useChatSocket: Socket disconnected");
      isInitialized.current = false;
    };

    // --------------------- SOCKET EVENTS ---------------------

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
      dispatch((dispatch, getState) => {
        const currentOnlineUsers = getState().chat.onlineUsers;
        if (!currentOnlineUsers.includes(userId)) {
          dispatch(setOnlineUsers([...currentOnlineUsers, userId]));
        }
      });
    });

    // 🔴 User Offline
    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }: { userId: string }) => {
      console.log("🔴 User offline:", userId);
      dispatch(setUserOffline({ userId }));
      dispatch((dispatch, getState) => {
        const currentOnlineUsers = getState().chat.onlineUsers;
        dispatch(
          setOnlineUsers(currentOnlineUsers.filter((id) => id !== userId))
        );
      });
    });

    // 📄 User Status
    socket.on(
      SOCKET_EVENTS.PRESENCE_LIST,
      (data: { userId: string; isOnline: boolean; lastSeen?: string }[]) => {
        console.log("📋 Presence list received:", data);

        const onlineUsers = data
          .filter((user) => user.isOnline)
          .map((user) => user.userId);

        dispatch(setOnlineUsers(onlineUsers));
      }
    );

    // 🔄 New conversation created
    socket.on("newConversation", (conversation: Conversation) => {
      console.log("🆕 New conversation via socket:", conversation);
      dispatch(addConversationLocal(conversation));
    });

    // --------------------- CONNECTION HANDLERS ---------------------

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // --------------------- CLEANUP ---------------------

    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.MARK_SEEN);
      socket.off(SOCKET_EVENTS.TYPING);
      socket.off(SOCKET_EVENTS.STOP_TYPING);
      socket.off(SOCKET_EVENTS.USER_ONLINE);
      socket.off(SOCKET_EVENTS.USER_OFFLINE);
      socket.off(SOCKET_EVENTS.PRESENCE_LIST);
      socket.off("newConversation");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [dispatch, token]);

  // --------------------- HELPER FUNCTIONS ---------------------
  const joinConversation = (conversationId: string) => {
    if (!isInitialized.current) return;
    socketService.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
  };

  const sendMessage = (conversationId: string, text: string) => {
    if (!isInitialized.current) return;
    socketService.emit(SOCKET_EVENTS.SEND_MESSAGE, { conversationId, text });
  };

  const markSeen = (conversationId: string) => {
    if (!isInitialized.current) return;
    socketService.emit(SOCKET_EVENTS.MARK_SEEN, { conversationId });
  };

  const startTyping = (conversationId: string) => {
    if (!isInitialized.current) return;
    socketService.emit(SOCKET_EVENTS.TYPING, { conversationId });
  };

  const stopTyping = (conversationId: string) => {
    if (!isInitialized.current) return;
    socketService.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
  };

  const getPresenceList = () => {
    if (!isInitialized.current) return;
    socketService.emit(SOCKET_EVENTS.PRESENCE_LIST, {});
  };

  return {
    isInitialized,
    joinConversation,
    sendMessage,
    markSeen,
    startTyping,
    stopTyping,
    getPresenceList,
  };
};
