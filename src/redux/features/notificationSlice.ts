import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NotificationsState {
  fcmToken: string | null;
  permission: NotificationPermission | null;
  unreadCount: number;
}

const initialState: NotificationsState = {
  fcmToken: null,
  permission: null,
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // FCM
    setFCMToken(state, action: PayloadAction<string | null>) {
      state.fcmToken = action.payload;
    },
    setPermission(state, action: PayloadAction<NotificationPermission>) {
      state.permission = action.payload;
    },
    incrementUnread(state) {
      state.unreadCount += 1;
    },
    resetUnread(state) {
      state.unreadCount = 0;
    },
  },
});

export const { setFCMToken, setPermission, incrementUnread, resetUnread } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
