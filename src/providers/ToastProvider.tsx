"use client";

import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAppSelector } from "@/redux/store";
import toast from "react-hot-toast";

export function ToastProvider() {
  const notifications = useAppSelector((state) => state.notifications.list);

  useEffect(() => {
    const lastNotification = notifications[0];
    if (lastNotification) {
      toast.success(() => (
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {lastNotification.title}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {lastNotification.message}
          </p>
        </div>
      ));
    }
  }, [notifications]);

  return <Toaster position="top-center" />;
}
