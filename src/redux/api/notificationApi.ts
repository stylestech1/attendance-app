import { api } from "./notificationBaseApi";

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // FCM
    saveFCMToken: builder.mutation<{ success: boolean }, { fcmToken: string }>({
      query: (body) => ({
        url: "/api/v1/save-fcm-token",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useSaveFCMTokenMutation,
} = notificationApi;
