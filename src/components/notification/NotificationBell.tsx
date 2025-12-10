"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/redux/store";
import {
  useGetAllNotificationsQuery,
  useMarkAllAsReadMutation,
} from "@/redux/api/notificationApi";
import { Bell, Check } from "lucide-react";
import { format } from "date-fns";
import { TNotification } from "@/types/notificationType";
import { usePathname, useRouter } from "next/navigation";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const token = useAppSelector((state) => state.auth.token);
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: notifications,
    isLoading,
    refetch,
  } = useGetAllNotificationsQuery(
    { page: 1, limit: 10 },
    { skip: !token, pollingInterval: 30000 }
  );

  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notificationList: TNotification[] = Array.isArray(notifications)
    ? notifications
    : [];

  const unreadCount = notificationList.filter(
    (n) => n.status === "unread"
  ).length;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (module: TNotification["module"]) => {
    let path = "";

    switch (module) {
      case "chat":
        path = `/chat`;
        break;

      default:
        path = `/notifications`;
    }
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      {!(
        pathname.startsWith("/chat") ||
        pathname === "/" ||
        pathname === "/login"
      ) && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-5 right-5 p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          aria-label={`Notifications ${
            unreadCount > 0 ? `(${unreadCount} unread)` : ""
          }`}
        >
          <Bell className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-5 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
              >
                <Check className="w-3 h-3" />
                Mark all
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">
                  Loading notifications...
                </p>
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={(e) => {
                    if (notification.refId) {
                      e.stopPropagation();
                      handleNotificationClick(notification.module);
                    }
                  }}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    notification.status === "unread" ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            notification.status === "unread"
                              ? "bg-blue-500 animate-pulse"
                              : "bg-gray-300"
                          }`}
                        />
                        <h4 className="font-medium text-gray-800 text-sm">
                          {notification.title}
                        </h4>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* {notification.metadata && (
                        <div className="mt-2">
                          {notification.metadata.conversationId && (
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              💬 Message
                            </span>
                          )}
                        </div>
                      )} */}
                    </div>

                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {format(new Date(notification.createdAt), "HH:mm")}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {format(new Date(notification.createdAt), "MMM d")}
                    </span>

                    {notification.from && (
                      <span className="text-xs text-gray-600">
                        From: {notification.from}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  New notifications will appear here
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {/* <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <button
              onClick={() => {
                // TODO: Navigate to notifications page
                setIsOpen(false);
              }}
              className="text-xs text-gray-600 hover:text-gray-800 w-full text-center py-2 hover:bg-white rounded-md transition-colors duration-200"
            >
              View all notifications
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
}
