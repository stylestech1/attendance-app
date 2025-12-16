"use client";
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authSlice from "./features/authSlice";
import usersReducer from "./features/usersSlice";
import chatSlice from "./features/chatSlice";
import { chatApi } from "./api/chatApi";
import notificationsSlice from "./features/notificationSlice";
import { notificationApi } from "./api/notificationApi";

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    auth: authSlice,
    users: usersReducer,
    notifications: notificationsSlice,
    [chatApi.reducerPath]: chatApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(chatApi.middleware)
      .concat(notificationApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
