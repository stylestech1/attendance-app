"use client";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  addLiveMessage,
  markMessageSeenLocal,
  setTyping,
  setUserOnline,
  setUserOffline,
  setOnlineUsers,
  setUserPresence,
} from "@/redux/features/chatSlice";
import { socketService } from "@/services/socketService";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Message } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";

/* -------------------------------------------------------------------------- */
/*                                useChatSocket                                */
/* -------------------------------------------------------------------------- */

export const useChatSocket = () => {
  const dispatch = useAppDispatch();
  const listenersAttached = useRef(false);
  const lastSocketId = useRef<string | null>(null);
  const { auth } = useAuth();

  /* -------------------------------------------------------------------------- */
  /*                    REDUX → REF (BRIDGE)                                    */
  /* -------------------------------------------------------------------------- */

  const selectedConversationId = useAppSelector(
    (state) => state.chat.selectedConversationId
  );

  const selectedConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  /* -------------------------------------------------------------------------- */
  /*                             REGISTER LISTENERS                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || lastSocketId.current === socket.id) return;
    lastSocketId.current = socket.id || null;

    /* ---------------------------- MESSAGES ---------------------------- */

    const offNewMessage = socketService.on(
      SOCKET_EVENTS.NEW_MESSAGE,
      (msg: Message) => {
        console.log("📩 New message received:", msg);
        dispatch(addLiveMessage(msg));
      }
    );

    /* ---------------------------- SEEN STATUS -------------------------- */

    const offSeenUpdate = socketService.on(
      SOCKET_EVENTS.SEEN_UPDATE,
      ({ conversationId }: { conversationId: string }) => {
        console.log("👁️ Messages seen in conversation:", conversationId);
        dispatch(markMessageSeenLocal(conversationId));
      }
    );

    const offSeenAck = socketService.on(
      SOCKET_EVENTS.SEEN_ACKNOWLEDGED,
      ({ conversationId }: { conversationId: string }) => {
        console.log("✅ Seen acknowledged for conversation:", conversationId);
        dispatch(markMessageSeenLocal(conversationId));
      }
    );

    // ---------------------------- TYPING -------------------------------

    const offTyping = socketService.on(
      SOCKET_EVENTS.TYPING,
      ({ userId }: { userId: string }) => {
        const conversationId = selectedConversationIdRef.current;

        console.log(
          "⌨️ User typing:",
          userId,
          "in conversation:",
          conversationId
        );

        if (!conversationId) return;

        dispatch(setTyping({ conversationId, isTyping: true }));

        setTimeout(() => {
          dispatch(setTyping({ conversationId, isTyping: false }));
        }, 3000);
      }
    );

    const offStopTyping = socketService.on(
      SOCKET_EVENTS.STOP_TYPING,
      ({ userId, auto }: { userId: string; auto: boolean }) => {
        const conversationId = selectedConversationIdRef.current;

        console.log(
          "🛑 User stopped typing:",
          userId,
          "in conversation:",
          conversationId,
          "auto:",
          auto
        );

        if (!conversationId) return;

        dispatch(setTyping({ conversationId, isTyping: false }));
      }
    );

    /* ---------------------------- PRESENCE ----------------------------- */

    const offUserOnline = socketService.on(
      SOCKET_EVENTS.USER_ONLINE,
      ({ userId }: { userId: string }) => {
        console.log("🟢 User online:", userId);
        dispatch(setUserOnline({ userId }));
      }
    );

    const offUserOffline = socketService.on(
      SOCKET_EVENTS.USER_OFFLINE,
      ({ userId, lastSeen }: { userId: string; lastSeen?: string }) => {
        console.log("🔴 User offline:", userId);
        dispatch(setUserOffline({ userId, lastSeen }));
      }
    );

    const offPresenceList = socketService.on(
      SOCKET_EVENTS.PRESENCE_LIST,
      (data: { userId: string; isOnline: boolean; lastSeen?: string }[]) => {
        console.log("📋 Presence list received:", data);

        const presenceMap = data.reduce((acc, u) => {
          acc[u.userId] = {
            isOnline: u.isOnline,
            lastSeen: u.lastSeen,
          };
          return acc;
        }, {} as Record<string, { isOnline: boolean; lastSeen?: string }>);

        dispatch(setUserPresence(presenceMap));
      }
    );

    /* -------------------------- CONVERSATIONS -------------------------- */

    const offConversationJoined = socketService.on(
      SOCKET_EVENTS.CONVERSATION_JOINED,
      ({ conversationId }: { conversationId: string }) => {
        console.log("🤝 Joined conversation:", conversationId);
      }
    );

    const offConversationLeft = socketService.on(
      SOCKET_EVENTS.CONVERSATION_LEFT,
      ({ conversationId }: { conversationId: string }) => {
        console.log("👋 Left conversation:", conversationId);
      }
    );

    /* ------------------------------ ERRORS ------------------------------ */

    const offSocketError = socketService.on(
      SOCKET_EVENTS.SOCKET_ERROR,
      (error: unknown) => {
        console.error("🚨 Socket error:", error);
      }
    );

    /* ----------------------------- CLEANUP ----------------------------- */

    return () => {
      console.log("🧹 Cleaning up chat socket listeners...");
      listenersAttached.current = false;

      offNewMessage();
      offSeenUpdate();
      offSeenAck();
      offTyping();
      offStopTyping();
      offUserOnline();
      offUserOffline();
      offPresenceList();
      offConversationJoined();
      offConversationLeft();
      offSocketError();
    };
  }, [dispatch, auth.id]);

  /* -------------------------------------------------------------------------- */
  /*                              EMIT HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  return {
    joinConversation: (conversationId: string) => {
      // selectedConversationId = conversationId;
      socketService.joinConversation(conversationId);
    },

    leaveConversation: (conversationId: string) => {
      if (selectedConversationId === conversationId) {
        // selectedConversationId = null;
      }
      socketService.leaveConversation(conversationId);
    },

    sendMessage: (conversationId: string, text: string) =>
      socketService.sendMessage(conversationId, text),

    markSeen: (conversationId: string) =>
      socketService.markSeen(conversationId),

    startTyping: (conversationId: string) =>
      socketService.startTyping(conversationId),

    stopTyping: (conversationId: string) =>
      socketService.stopTyping(conversationId),

    getPresenceList: () => socketService.getPresenceList(),

    ping: () => socketService.emit(SOCKET_EVENTS.PING),
  };
};
