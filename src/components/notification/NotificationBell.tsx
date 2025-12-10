"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/redux/store";
import {
  useGetAllNotificationsQuery,
  useMarkAllAsReadMutation,
} from "@/redux/api/notificationApi";
import { Bell, Check, Settings, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { TNotification } from "@/types/notificationType";
import { usePathname, useRouter } from "next/navigation";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="cursor-pointer group fixed top-6 right-6 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-2xl z-50 hover:scale-105"
          aria-label={`Notifications ${
            unreadCount > 0 ? `(${unreadCount} unread)` : ""
          }`}
        >
          <div className="relative">
            <Bell className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed top-20 right-6 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Notifications</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Mark all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[480px] overflow-y-auto">
            {isLoading ? (
              <div className="p-10 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => notification.refId && handleNotificationClick(notification.module)}
                  className={`p-5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    notification.status === "unread" ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            notification.status === "unread"
                              ? "bg-blue-500 animate-pulse"
                              : "bg-gray-300"
                          }`}
                        />
                        <h4 className="font-bold text-gray-800 text-base">
                          {notification.title}
                        </h4>
                        {notification.status === "unread" && (
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {notification.message}
                      </p>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500 font-medium">
                            {format(new Date(notification.createdAt), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.createdAt), "HH:mm")}
                          </span>
                          {notification.from && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                              From: {notification.from}
                            </span>
                          )}
                        </div>
                        
                        {notification.refId && (
                          <ExternalLink className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bell className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">No Notifications</h4>
                <p className="text-gray-500 text-sm mb-1">{`You're`} all caught up!</p>
                <p className="text-gray-400 text-xs">New notifications will appear here</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {
                router.push('/notifications');
                setIsOpen(false);
              }}
              className="w-full py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2"
            >
              View All Notifications
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}