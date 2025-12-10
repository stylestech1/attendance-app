"use client";
import { useState } from "react";
import { MessageSquare, X, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGetUserConversationsQuery } from "@/redux/api/chatApi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, auth } = useAuth();
  const pathname = usePathname();
  const { data: conversations = [] } = useGetUserConversationsQuery(undefined, {
    skip: !isAuthenticated || !isOpen,
  });

  if (!isAuthenticated) return null;

  const unreadCount = conversations.filter(
    (conv) =>
      conv.lastMessage &&
      !conv.lastMessage.seen &&
      conv.lastMessage.sender?.id !== auth.id
  ).length;

  return (
    <>
      {/* Chat Button */}
      {!(
        pathname.startsWith("/chat") ||
        pathname === "/" ||
        pathname === "/login"
      ) && (
        <Link
          href={"/chat"}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 z-50 flex items-center justify-center hover:scale-105"
        >
          <div className="relative">
            <MessageSquare className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                {unreadCount}
              </span>
            )}
            {isHovered && (
              <div className="absolute -top-10 right-1/2 translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="font-semibold">Chat</span>
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 px-1.5 py-0.5 rounded text-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
                style={{
                  left: `${20 + i * 30}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '3s',
                }}
              />
            ))}
          </div>
        </Link>
      )}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 0.6; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}