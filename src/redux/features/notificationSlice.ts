import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TNotification } from "@/types/notificationType";

interface NotificationsState {
  list: TNotification[];
}

const initialState: NotificationsState = {
  list: [],
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<TNotification>) => {
      state.list.unshift(action.payload);
    },
    updateNotificationStatus: (
      state,
      action: PayloadAction<{ id: string; status: "read" | "unread" }>
    ) => {
      const notif = state.list.find((n) => n.id === action.payload.id);
      if (notif) notif.status = action.payload.status;
    },
    updateAllNotificationsStatus: (
      state,
      action: PayloadAction<"read" | "unread">
    ) => {
      state.list = state.list.map((n) => ({ ...n, status: action.payload }));
    },
    clearNotifications: (state) => {
      state.list = [];
    },
  },
});

export const { addNotification, updateNotificationStatus, updateAllNotificationsStatus, clearNotifications } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;