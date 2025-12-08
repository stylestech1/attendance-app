"use client";
import { Conversation } from "@/types/chat";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageSquare, Users } from "lucide-react";
import { useState } from "react";

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export default function ChatSidebar({
  conversations,
  selectedConvId,
  onSelectConversation,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");

  const conversationsArray = Array.isArray(conversations) ? conversations : [];

  const filteredConversations = conversationsArray.filter((conv) =>
    conv.members.some((member) =>
      member.name?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Messages
        </h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversationsArray.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-medium mb-2">No conversations yet</h3>
            <p className="text-sm mb-4">Start a conversation with your team members</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Find People
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No matching conversations</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConvId === conversation.id
                  ? "bg-blue-50 border-blue-200"
                  : ""
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {conversation.members
                      .map((member) => member.name || "Unknown")
                      .join(", ")}
                  </h3>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.text || "📎 Attachment"}
                    </p>
                  )}
                </div>
                {conversation.updatedAt && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(conversation.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
