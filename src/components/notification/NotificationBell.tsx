"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import {
  useGetAllNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkSpecificAsReadMutation,
} from "@/redux/api/notificationApi";
import {
  Bell,
  Check,
  ExternalLink,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { TNotification } from "@/types/notificationType";
import { usePathname, useRouter } from "next/navigation";
import { socketService } from "@/services/socketService";
import { notificationService } from "@/services/notificationService";
import {
  addNotification,
  updateNotificationStatus,
  updateAllNotificationsStatus,
} from "@/redux/features/notificationSlice";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const token = useAppSelector((state) => state.auth.token);
  const localNotifications = useAppSelector(
    (state) => state.notifications.list
  );
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: serverNotifications = [],
    isLoading,
    isFetching,
    refetch: refetchServerNotifications,
  } = useGetAllNotificationsQuery(
    { page: 1, limit: 100 },
    { skip: !token, refetchOnMountOrArgChange: true }
  );

  // Mutations
  const [markAllAsReadAPI] = useMarkAllAsReadMutation();
  const [markSpecificAsReadAPI] = useMarkSpecificAsReadMutation();

  const unreadCount = localNotifications.filter(
    (n) => n.status === "unread"
  ).length;

  const allNotifications = [...localNotifications];

  serverNotifications.forEach((serverNotif) => {
    if (
      !allNotifications.some((localNotif) => localNotif.id === serverNotif.id)
    ) {
      allNotifications.push(serverNotif);
    }
  });

  const sortedNotifications = [...allNotifications]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 50);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.src = "/audio/notify.wav";
      audioRef.current.preload = "auto";
      audioRef.current.volume = 0.7;
      audioRef.current.load();
    }

    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => {
              audioRef.current?.pause();
            })
            .catch(() => {});
        }
      }
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [hasUserInteracted]);

  useEffect(() => {
    if (!token) return;

    console.log("🚀 Initializing WebSocket connection...");

    notificationService.initialize();

    const socket = socketService.initialize(token);

    const updateConnectionStatus = () => {
      setSocketConnected(socketService.isConnected());
    };

    socket?.on("connect", () => {
      console.log("✅ WebSocket connected");
      setSocketConnected(true);
      setLastUpdateTime(new Date());
    });

    socket?.on("disconnect", () => {
      console.log("🔌 WebSocket disconnected");
      setSocketConnected(false);
    });

    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const unsubscribeNotification = socketService.onNotification(
      (notification: TNotification) => {
        console.log("🔔 Real-time notification received:", notification);

        dispatch(
          addNotification({
            ...notification,
            status: "unread",
            createdAt: new Date().toISOString(),
          })
        );

        if (isSoundEnabled && hasUserInteracted) {
          playNotificationSound();
        }

        setLastUpdateTime(new Date());
      }
    );

    return () => {
      if (unsubscribeNotification) {
        unsubscribeNotification();
      }
    };
  }, [token, isSoundEnabled, hasUserInteracted, dispatch]);

  const playNotificationSound = useCallback(async () => {
    if (!isSoundEnabled || !audioRef.current || !hasUserInteracted) {
      return;
    }

    try {
      setIsPlayingSound(true);
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setTimeout(() => setIsPlayingSound(false), 500);
    } catch (error) {
      console.error("❌ Error playing notification sound:", error);
      setIsPlayingSound(false);
      if (audioRef.current) {
        audioRef.current.load();
      }
    }
  }, [isSoundEnabled, hasUserInteracted]);

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

  useEffect(() => {
    if (isOpen && token) {
      refetchServerNotifications();
      setLastUpdateTime(new Date());
    }
  }, [isOpen, token, refetchServerNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadAPI().unwrap();

      dispatch(updateAllNotificationsStatus("read"));

      refetchServerNotifications();
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      dispatch(
        updateNotificationStatus({ id: notificationId, status: "read" })
      );

      await markSpecificAsReadAPI(notificationId).unwrap();

      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      dispatch(
        updateNotificationStatus({ id: notificationId, status: "unread" })
      );
    }
  };

  const handleNotificationClick = (notification: TNotification) => {
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id);
    }

    let path = "";
    switch (notification.module) {
      case "chat":
        path = `/chat?conversation=${notification.refId}`;
        break;
      default:
        path = `/notifications`;
    }

    setIsOpen(false);

    if (path) {
      router.push(path);
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  const handleReconnect = () => {
    if (token) {
      socketService.initialize(token);
    }
  };

  const handleRefresh = () => {
    refetchServerNotifications();
    setLastUpdateTime(new Date());
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      {!(
        pathname.startsWith("/chat") ||
        pathname === "/" ||
        pathname === "/login"
      ) && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`cursor-pointer group fixed top-6 right-6 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-2xl z-50 hover:scale-105 ${
              isPlayingSound ? "ring-4 ring-blue-300 ring-opacity-50" : ""
            }`}
            aria-label={`Notifications ${
              unreadCount > 0 ? `(${unreadCount} unread)` : ""
            }`}
          >
            <div className="relative">
              <Bell className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              {/* Sound playing indicator */}
              {isPlayingSound && (
                <div className="absolute inset-0 rounded-2xl bg-blue-400 animate-ping opacity-20"></div>
              )}
            </div>
          </button>

          {/* WebSocket Connection Indicator */}
          <div className="fixed top-24 right-6 z-40">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="font-medium">
                {socketConnected ? "Live" : "Offline"}
              </span>
              {!socketConnected && (
                <button
                  onClick={handleReconnect}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed top-20 right-6 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Notifications</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-blue-100 text-sm">
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${
                              unreadCount > 1 ? "s" : ""
                            }`
                          : "All caught up!"}
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            socketConnected ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        <span className="text-xs">
                          {socketConnected ? "Live" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sound control button */}
                  <button
                    onClick={toggleSound}
                    className="cursor-pointer p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative group"
                    aria-label={
                      isSoundEnabled
                        ? "Mute notification sound"
                        : "Enable notification sound"
                    }
                  >
                    {isSoundEnabled ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5" />
                    )}
                    <div className="absolute -top-8 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {isSoundEnabled ? "Sound ON" : "Sound OFF"}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Sound and update indicators */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSoundEnabled
                      ? "bg-green-400 animate-pulse"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-xs text-blue-200">
                  {isSoundEnabled ? "Sound enabled" : "Sound muted"}
                </span>
                {!hasUserInteracted && (
                  <span className="text-xs text-yellow-300 ml-2">
                    (Click to activate sound)
                  </span>
                )}
              </div>

              {lastUpdateTime && (
                <span className="text-xs text-blue-200">
                  Updated: {format(lastUpdateTime, "HH:mm:ss")}
                </span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-5 py-3 bg-blue-50 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isFetching}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-blue-700 hover:bg-white/80 rounded-xl transition-all duration-200 font-medium text-sm border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    Mark all as read
                  </button>
                )}

                <button
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white text-gray-700 hover:bg-white/80 rounded-xl transition-all duration-200 font-medium text-sm border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Unread</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span>Read</span>
                </div>
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
            ) : sortedNotifications.length > 0 ? (
              sortedNotifications.map((notification, index) => (
                <div
                  key={`${notification.id}-${notification.createdAt}-${index}`}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-150 ${
                    notification.status === "unread"
                      ? "bg-gradient-to-r from-blue-50/50 to-white border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              notification.status === "unread"
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          />
                          {notification.status === "unread" && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-base line-clamp-1">
                            {notification.title}
                          </h4>
                          {notification.status === "unread" && (
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full mt-1">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500 font-medium">
                            {format(
                              new Date(notification.createdAt),
                              "MMM d, yyyy"
                            )}
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
                          <ExternalLink className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0" />
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
                <h4 className="font-bold text-gray-800 text-lg mb-2">
                  No Notifications
                </h4>
                <p className="text-gray-500 text-sm mb-1">
                  {`You're`} all caught up!
                </p>
                <p className="text-gray-400 text-xs">
                  {socketConnected
                    ? "New notifications will appear here in real-time"
                    : "Connect to receive real-time notifications"}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {
                router.push("/notifications");
                setIsOpen(false);
              }}
              className="w-full py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2"
            >
              View All Notifications
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="mt-3 text-center text-xs text-gray-500">
              Showing {sortedNotifications.length} notification
              {sortedNotifications.length !== 1 ? "s" : ""}
              {!socketConnected && (
                <p className="text-yellow-600 mt-1">
                  ⚠️ Using cached data. Reconnect for real-time updates.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
