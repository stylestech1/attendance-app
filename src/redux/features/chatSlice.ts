import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Conversation, Message } from "@/types/chat";

interface ChatState {
  liveMessages: Record<string, Message[]>;
  conversations: Record<string, Conversation>;
  selectedConversationId: string | null;
  typing: Record<string, boolean>;
  onlineUsers: string[];
}

const initialState: ChatState = {
  liveMessages: {},
  conversations: {},
  selectedConversationId: null,
  typing: {},
  onlineUsers: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // 1️⃣ Select Conversation
    setSelectedConversation(state, action: PayloadAction<string | null>) {
      state.selectedConversationId = action.payload;
    },

    // 2️⃣ Add Message
    addLiveMessage(state, action: PayloadAction<Message>) {
      const msg = action.payload;
      const convId = msg.conversationId;

      if (!state.liveMessages[convId]) {
        state.liveMessages[convId] = [];
      }

      if (!state.liveMessages[convId].some((m) => m.id === msg.id)) {
        state.liveMessages[convId].push(msg);
      }

      if (state.conversations[convId]) {
        state.conversations[convId].lastMessage = msg;

        if (!state.conversations[convId].messages) {
          state.conversations[convId].messages = [];
        }

        const msgExists = state.conversations[convId].messages?.some(
          (m) => m.id === msg.id
        );

        if (!msgExists) {
          state.conversations[convId].messages?.push(msg);
        }
      }
    },

    // 3️⃣ Update Converstation
    updateConversation(state, action: PayloadAction<Conversation>) {
      const conv = action.payload;
      const oldMessages = state.liveMessages[conv.id] || [];

      state.conversations[conv.id] = conv;
      state.liveMessages[conv.id] = [
        ...oldMessages,
        ...(conv.messages?.filter(
          (m) => !oldMessages.some((om) => om.id === m.id)
        ) || []),
      ];
    },

    // 4️⃣ Mark Seen
    markMessageSeenLocal(state, action: PayloadAction<string>) {
      const convId = action.payload;

      if (state.liveMessages[convId]) {
        state.liveMessages[convId] = state.liveMessages[convId].map((msg) => ({
          ...msg,
          seen: true,
        }));
      }
    },

    // 5️⃣ Add New Conversation
    addConversationLocal(state, action: PayloadAction<Conversation>) {
      const conv = action.payload;
      state.conversations[conv.id] = conv;
    },

    // 6️⃣ Show Typing
    setTyping(
      state,
      action: PayloadAction<{ conversationId: string; isTyping: boolean }>
    ) {
      state.typing[action.payload.conversationId] = action.payload.isTyping;
    },

    // 7️⃣ Show User Online
    setUserOnline: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },

    // 7️⃣ Show User Offline
    setUserOffline: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
    },

    // 8️⃣ Show All Users that online 
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
  },
});

export const {
  setSelectedConversation,
  addLiveMessage,
  updateConversation,
  markMessageSeenLocal,
  addConversationLocal,
  setTyping,
  setUserOnline,
  setUserOffline,
  setOnlineUsers
} = chatSlice.actions;
export default chatSlice.reducer;
