import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NotificationsState {
  fcmToken: string | null;
  permission: NotificationPermission | null;
}

const initialState: NotificationsState = {
  fcmToken: null,
  permission: null,
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
  },
});

export const {
  setFCMToken,
  setPermission,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
