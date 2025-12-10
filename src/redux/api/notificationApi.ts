import { ApiResponse } from "@/types/chat";
import { api } from "./notificationBaseApi";
import { TNotification } from "@/types/notificationType";

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllNotifications: builder.query<
      TNotification[],
      { page: number; limit: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/notifications?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TNotification[]>) => {
        return response.data || [];
      },
      providesTags: ["Notifications"],
      keepUnusedDataFor: 60 * 60 * 24,
    }),

    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: `/api/v1/notifications/mark-all`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    markSpecificAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/notifications/mark/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetAllNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkSpecificAsReadMutation,
} = notificationApi;
