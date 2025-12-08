import {
  ApiResponse,
  Conversation,
  MarkSeenResponse,
  Message,
} from "@/types/chat";
import { api } from "./baseApi";

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // 1️⃣ Get User Conversations
    getUserConversations: builder.query<Conversation[], void>({
      query: () => `/api/v1/chat/conversations`,
      transformResponse: (response: ApiResponse<Conversation[]>) => {
        return response.data || [];
      },
      providesTags: ["Conversations"],
    }),

    // 2️⃣ Create Or Get User Conversations
    createOrGetConversation: builder.mutation<Conversation, { userId: string }>(
      {
        query: (body) => ({
          url: `/api/v1/chat/conversations/start`,
          method: "POST",
          body,
        }),
        transformResponse: (response: ApiResponse<Conversation>) => {
          return response.data;
        },
        invalidatesTags: ["Conversations"],
      }
    ),

    // 3️⃣ Send Messages
    addMessage: builder.mutation<
      Message,
      { conversationId: string; text: string }
    >({
      query: ({ conversationId, text }) => ({
        url: `/api/v1/chat/messages/${conversationId}`,
        method: "POST",
        body: { text },
      }),
      transformResponse: (response: ApiResponse<Message>) => {
        return response.data;
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: "Messages", id: arg.conversationId },
        "Conversations",
      ],
    }),

    // 4️⃣ Get Conversation
    getConversationMessages: builder.query<Message[], string>({
      query: (conversationId) => `/api/v1/chat/messages/${conversationId}`,
      transformResponse: (response: ApiResponse<Message[]>) => {
        return response.data || [];
      },
      providesTags: (_res, _err, id) => [{ type: "Messages", id }],
    }),

    // 5️⃣ Mark as Seen
    markMessagesSeen: builder.mutation<
      MarkSeenResponse,
      { conversationId: string }
    >({
      query: ({ conversationId }) => ({
        url: `/api/v1/chat/messages/seen/${conversationId}`,
        method: "PUT",
      }),
      transformResponse: (response: MarkSeenResponse) => {
        return response;
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: "Messages", id: arg.conversationId },
        "Conversations",
      ],
    }),
  }),
});

export const {
  useGetUserConversationsQuery,
  useCreateOrGetConversationMutation,
  useAddMessageMutation,
  useGetConversationMessagesQuery,
  useMarkMessagesSeenMutation,
} = chatApi;
