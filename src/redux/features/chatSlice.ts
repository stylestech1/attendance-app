import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Conversation, Message, Presence } from "@/types/chat";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ChatState {
  liveMessages: Record<string, Message[]>;
  conversations: Record<string, Conversation>;
  selectedConversationId: string | null;
  typing: Record<string, boolean>;
  onlineUsers: string[];
  presence: Presence;
  unreadCounts: Record<string, number>;
}

/* -------------------------------------------------------------------------- */
/*                                INITIAL STATE                                */
/* -------------------------------------------------------------------------- */

const initialState: ChatState = {
  liveMessages: {},
  conversations: {},
  selectedConversationId: null,
  typing: {},
  onlineUsers: [],
  presence: {},
  unreadCounts: {},
};

/* -------------------------------------------------------------------------- */
/*                                   SLICE                                    */
/* -------------------------------------------------------------------------- */

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /* -------------------------- SELECT CONVERSATION ------------------------- */
    setSelectedConversation(state, action: PayloadAction<string | null>) {
      state.selectedConversationId = action.payload;
      if (action.payload) {
        state.unreadCounts[action.payload] = 0;
      }
    },

    /* ----------------------------- ADD MESSAGE ----------------------------- */
    addLiveMessage(state, action: PayloadAction<Message>) {
      const msg = action.payload;
      const convId = msg.conversationId;

      if (!state.liveMessages[convId]) {
        state.liveMessages[convId] = [];
      }

      const exists = state.liveMessages[convId].some((m) => m.id === msg.id);

      if (!exists) {
        state.liveMessages[convId].push(msg);

        if (state.selectedConversationId !== convId) {
          state.unreadCounts[convId] = (state.unreadCounts[convId] || 0) + 1;
        }
      }

      // update last message metadata
      if (state.conversations[convId]) {
        state.conversations[convId].lastMessage = msg;
        state.conversations[convId].updatedAt = msg.createdAt;
      }
    },

    /* ------------------------- UPSERT (Update & Insert) CONVERSATION -------------------------- */
    upsertConversation(state, action: PayloadAction<Conversation>) {
      const conv = action.payload;

      state.conversations[conv.id] = {
        ...state.conversations[conv.id],
        ...conv,
        lastMessage:
          conv.lastMessage ?? state.conversations[conv.id]?.lastMessage ?? null,
      };

      // hydrate messages only once (initial load)
      if (conv.messages?.length) {
        if (!state.liveMessages[conv.id]) {
          state.liveMessages[conv.id] = [];
        }

        conv.messages.forEach((msg) => {
          const exists = state.liveMessages[conv.id].some(
            (m) => m.id === msg.id
          );
          if (!exists) {
            state.liveMessages[conv.id].push(msg);
          }
        });
      }
    },

    /* ----------------------------- MARK SEEN ------------------------------ */
    markMessageSeen: (
      state,
      action: PayloadAction<{
        conversationId: string;
        currentUserId?: string;
      }>
    ) => {
      const { conversationId, currentUserId } = action.payload;
      const messages = state.liveMessages[conversationId] || [];

      state.liveMessages[conversationId] = messages.map((msg) => ({
        ...msg,
        seen: msg.sender?.id !== currentUserId ? true : msg.seen,
      }));
    },

    /* -------------------------- ADD CONVERSATION --------------------------- */
    addConversationLocal(state, action: PayloadAction<Conversation>) {
      const conv = action.payload;
      state.conversations[conv.id] = conv;
    },

    /* ------------------------------ TYPING -------------------------------- */
    setTyping(
      state,
      action: PayloadAction<{ conversationId: string; isTyping: boolean }>
    ) {
      state.typing[action.payload.conversationId] = action.payload.isTyping;
    },

    /* ----------------------------- PRESENCE -------------------------------- */
    setUserOnline(state, action: PayloadAction<{ userId: string }>) {
      const { userId } = action.payload;
      if (!state.onlineUsers.includes(userId)) state.onlineUsers.push(userId);

      state.presence[userId] = {
        ...state.presence[userId],
        isOnline: true,
        lastSeen: undefined,
      };
    },

    setUserOffline(
      state,
      action: PayloadAction<{ userId: string; lastSeen?: string }>
    ) {
      const { userId, lastSeen } = action.payload;
      state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);

      state.presence[userId] = {
        ...state.presence[userId],
        isOnline: false,
        lastSeen: lastSeen || new Date().toISOString(),
      };
    },

    setOnlineUsers(state, action: PayloadAction<string[]>) {
      state.onlineUsers = action.payload;
      action.payload.forEach((userId) => {
        state.presence[userId] = {
          ...state.presence[userId],
          isOnline: true,
        };
      });
    },

    setUserPresence(
      state,
      action: PayloadAction<
        Record<string, { isOnline: boolean; lastSeen?: string }>
      >
    ) {
      state.presence = { ...action.payload };

      state.onlineUsers = Object.entries(state.presence)
        .filter(([_, v]) => v.isOnline)
        .map(([userId]) => userId);

      Object.entries(state.presence).forEach(([userId, data]) => {
        if (!data.isOnline && !data.lastSeen) {
          state.presence[userId].lastSeen = new Date().toISOString();
        }
      });
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

export const {
  setSelectedConversation,
  addLiveMessage,
  upsertConversation,
  markMessageSeen,
  addConversationLocal,
  setTyping,
  setUserOnline,
  setUserOffline,
  setOnlineUsers,
  setUserPresence,
} = chatSlice.actions;

export default chatSlice.reducer;
