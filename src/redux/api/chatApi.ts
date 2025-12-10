import {
  ApiResponse,
  Conversation,
  MarkSeenResponse,
  Message,
} from "@/types/chat";
import { api } from "./chatBaseApi";
import { TUser } from "@/types/user";

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get All User in System
    getAllUser: builder.query<TUser[], void>({
      query: () => `/api/v1/adminDashboard`,
      transformResponse: (response: ApiResponse<TUser[]>) => response.data,
      providesTags: ["Users"],
    }),

    // Get User Conversations
    getUserConversations: builder.query<Conversation[], void>({
      query: () => `/api/v1/chat/conversations`,
      transformResponse: (response: ApiResponse<Conversation[]>) =>
        response.data || [],
      providesTags: ["Conversations"],
    }),

    // Create Or Get Conversation
    createOrGetConversation: builder.mutation<Conversation, { userId: string }>(
      {
        query: (body) => ({
          url: `/api/v1/chat/conversations/start`,
          method: "POST",
          body,
        }),
        transformResponse: (response: ApiResponse<Conversation>) =>
          response.data,
        invalidatesTags: ["Conversations"],
      }
    ),

    // Send Message
    addMessage: builder.mutation<
      Message,
      { conversationId: string; text: string }
    >({
      query: ({ conversationId, text }) => ({
        url: `/api/v1/chat/messages/${conversationId}`,
        method: "POST",
        body: { text },
      }),
      transformResponse: (response: ApiResponse<Message>) => response.data,
      invalidatesTags: (_res, _err, arg) => [
        { type: "Messages", id: arg.conversationId },
        "Conversations",
      ],
    }),

    // Get Conversation Messages
    getConversationMessages: builder.query<Message[], string>({
      query: (conversationId) => `/api/v1/chat/messages/${conversationId}`,
      transformResponse: (response: ApiResponse<Message[]>) =>
        response.data || [],
      providesTags: (_res, _err, id) => [{ type: "Messages", id }],
    }),

    // Mark Messages Seen
    markMessagesSeen: builder.mutation<
      MarkSeenResponse,
      { conversationId: string }
    >({
      query: ({ conversationId }) => ({
        url: `/api/v1/chat/messages/seen/${conversationId}`,
        method: "PUT",
      }),
      transformResponse: (response: MarkSeenResponse) => response,
      invalidatesTags: (_res, _err, arg) => [
        { type: "Messages", id: arg.conversationId },
        "Conversations",
      ],
    }),
  }),
});

export const {
  useGetAllUserQuery,
  useGetUserConversationsQuery,
  useCreateOrGetConversationMutation,
  useAddMessageMutation,
  useGetConversationMessagesQuery,
  useMarkMessagesSeenMutation,
} = chatApi;
