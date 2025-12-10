"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/redux/store";
import {
  useGetAllNotificationsQuery,
  useMarkAllAsReadMutation,
} from "@/redux/api/notificationApi";
import { Bell, Check, Settings, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { format } from "date-fns";
import { TNotification } from "@/types/notificationType";
import { usePathname, useRouter } from "next/navigation";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const token = useAppSelector((state) => state.auth.token);
  const pathname = usePathname();
  const router = useRouter();

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/audio/notify.wav");
      audioRef.current.preload = "auto";
      audioRef.current.volume = 1;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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

  // Play sound when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCount && isSoundEnabled && audioRef.current) {
      playNotificationSound();
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount, isSoundEnabled]);

  const playNotificationSound = async () => {
    if (!isSoundEnabled || !audioRef.current) return;

    try {
      setIsPlayingSound(true);
      
      // Reset audio to start
      audioRef.current.currentTime = 0;
      
      // Play with promise for better handling
      await audioRef.current.play();
      
      // Add visual feedback
      setTimeout(() => setIsPlayingSound(false), 500);
    } catch (error) {
      console.error("Error playing notification sound:", error);
      setIsPlayingSound(false);
    }
  };

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

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  const testSound = () => {
    playNotificationSound();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Sound test button (optional - for debugging) */}
      {/* <button
        onClick={testSound}
        className="fixed top-24 right-6 p-2 bg-gray-800 text-white rounded-lg z-40"
      >
        Test Sound
      </button> */}

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
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                {unreadCount}
              </span>
            )}
            
            {/* Sound playing indicator */}
            {isPlayingSound && (
              <div className="absolute inset-0 rounded-2xl bg-blue-400 animate-ping opacity-20"></div>
            )}
          </div>
          
          {/* Tooltip */}
          {isHovered && (
            <div className="absolute -top-10 right-1/2 translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span className="font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 px-1.5 py-0.5 rounded text-xs">
                  {unreadCount} new
                </span>
              )}
            </div>
          )}
        </button>
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
                    <p className="text-blue-100 text-sm mt-1">
                      {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
                    </p>
                  </div>
                  
                  {/* Sound control button */}
                  <button
                    onClick={toggleSound}
                    className="cursor-pointer p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative group"
                    aria-label={isSoundEnabled ? "Mute notification sound" : "Enable notification sound"}
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
            
            {/* Sound indicator */}
            <div className="mt-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSoundEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-blue-200">
                {isSoundEnabled ? "Sound enabled" : "Sound muted"}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-5 py-3 bg-blue-50 border-b">
            <div className="flex justify-between items-center">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white text-blue-700 hover:bg-white/80 rounded-xl transition-all duration-200 font-medium text-sm border border-blue-200 hover:border-blue-300"
                >
                  <Check className="w-4 h-4" />
                  Mark all as read
                </button>
              )}
              
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
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => notification.refId && handleNotificationClick(notification.module)}
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
                                ? "bg-blue-500 animate-pulse"
                                : "bg-gray-300"
                            }`}
                          />
                          {notification.status === "unread" && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute"></div>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-800 text-base">
                          {notification.title}
                        </h4>
                        {notification.status === "unread" && (
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full animate-bounce">
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