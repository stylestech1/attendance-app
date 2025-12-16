"use client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useSaveFCMTokenMutation } from "@/redux/api/notificationApi";
import { setFCMToken, setPermission } from "@/redux/features/notificationSlice";
import { generateFCMToken, messaging } from "@/firesbase/firebase";
import { onMessage } from "firebase/messaging";
import { useAppDispatch } from "@/redux/store";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const FCMProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const playSound = useNotificationSound();
  const [saveFCMToken] = useSaveFCMTokenMutation();
  const { auth } = useAuth();

  useEffect(() => {
    if (!auth.token) return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => console.log("SW registered:", reg))
        .catch((err) => console.error("SW registration failed:", err));
    }

    const init = async () => {
      const permission = await Notification.requestPermission();
      console.log("🔑 Permission", permission);
      dispatch(setPermission(permission));

      if (permission !== "granted") return;

      const token = await generateFCMToken();
      if (!token) return;

      dispatch(setFCMToken(token));
      try {
        await saveFCMToken({ fcmToken: token }).unwrap();
      } catch (err) {
        console.error("❌ Failed to save FCM token:", err);
      }
      console.log("💝 FCM token:", token);

      if (!messaging) return;

      onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "New Notification";
        const body = payload.notification?.body ?? "";

        playSound();

        toast.custom(() => (
          <div className="bg-white shadow-xl rounded-xl p-4 max-w-sm space-y-0.5">
            <p className="font-semibold">{title}</p>
            <p className="text-sm">{body}</p>
          </div>
        ));
      });
    };
    init();
  }, [auth.token]);

  return <>{children}</>;
};

export default FCMProvider;
