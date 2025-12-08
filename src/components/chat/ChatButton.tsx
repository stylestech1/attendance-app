"use client";
import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGetUserConversationsQuery } from "@/redux/api/chatApi";
import Link from "next/link";

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, auth } = useAuth();
  const { data: conversations = [] } = useGetUserConversationsQuery(undefined, {
    skip: !isAuthenticated || !isOpen,
  });

  if (!isAuthenticated) return null;

  const unreadCount = conversations.filter(
    conv => conv.lastMessage && !conv.lastMessage.seen && conv.lastMessage.sender?.id !== auth.id
  ).length;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="absolute bottom-6 right-6 w-80 bg-white rounded-2xl shadow-xl">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Messages</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversations List */}
            <div className="max-h-96 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No messages yet</p>
                  <Link
                    href="/chat"
                    className="mt-3 inline-block text-blue-600 hover:underline"
                    onClick={() => setIsOpen(false)}
                  >
                    Start a conversation
                  </Link>
                </div>
              ) : (
                conversations.map(conv => (
                  <Link
                    key={conv.id}
                    href={`/chat?conversation=${conv.id}`}
                    onClick={() => setIsOpen(false)}
                    className="block p-4 border-b hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">
                          {conv.members.map(m => m.name).filter(Boolean).join(", ")}
                        </h4>
                        {conv.lastMessage && (
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage.text}
                          </p>
                        )}
                      </div>
                      {conv.lastMessage && !conv.lastMessage.seen && conv.lastMessage.sender?.id !== auth.id && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <Link
                href="/chat"
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Open Full Chat
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}