import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Conversation, Message } from "@/types/chat";

interface ChatState {
  liveMessages: Record<string, Message[]>;
  conversations: Record<string, Conversation>;
  selectedConversationId: string | null;
  typing: Record<string, boolean>;
  onlineUsers: Record<string, boolean>;
}

const initialState: ChatState = {
  liveMessages: {},
  conversations: {},
  selectedConversationId: null,
  typing: {},
  onlineUsers: {},
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
      const convId = action.payload.conversationId;

      if (!state.liveMessages[convId]) {
        state.liveMessages[convId] = [];
      }

      state.liveMessages[convId].push(msg);

      // update last message
      if (state.conversations[convId]) {
        state.conversations[convId].lastMessage = msg;
      }
    },

    // 3️⃣ Update Converstation
    updateConversation(state, action: PayloadAction<Conversation>) {
      state.conversations[action.payload.id] = action.payload;
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
    setUserOnline(state, action: PayloadAction<{ userId: string }>) {
      state.onlineUsers[action.payload.userId] = true;
    },

    // 7️⃣ Show User Offline
    setUserOffline(state, action: PayloadAction<{ userId: string }>) {
      state.onlineUsers[action.payload.userId] = false;
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
  setUserOffline
} = chatSlice.actions;
export default chatSlice.reducer;
