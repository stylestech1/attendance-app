"use client";
import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGetUserConversationsQuery } from "@/redux/api/chatApi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
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
          className="cursor-pointer fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      )}
    </>
  );
}
