"use client";
import { useAuth } from "@/context/AuthContext";
import {
  useCreateOrGetConversationMutation,
  useGetAllUserQuery,
} from "@/redux/api/chatApi";
import { fetchUserProfile } from "@/redux/features/usersSlice";
import { RootState, useAppDispatch, useAppSelector } from "@/redux/store";
import { Conversation } from "@/types/chat";
import {
  Search,
  MessageSquare,
  Users,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const router = useRouter();
  const { auth, logout } = useAuth();
  const dispatch = useAppDispatch();

  /* ===================== LOCAL UI STATE ===================== */
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"conversations" | "users">(
    "conversations"
  );

  /* ===================== REDUX STATE ===================== */
  const { profile, loading: profileLoading } = useAppSelector(
    (state: RootState) => state.users
  );

  const onlineUsers = useAppSelector(
    (state: RootState) => state.chat.onlineUsers
  );

  const presenceList = useAppSelector(
    (state: RootState) => state.chat.presence
  );

  const getConvId = (conv: Conversation) => conv.id;

  const unreadCounts = useAppSelector(
    (state: RootState) => state.chat.unreadCounts
  );

  /* -------------------- FETCH PROFILE -------------------- */
  useEffect(() => {
    if (!auth?.token) return;
    dispatch(fetchUserProfile(auth.token));
  }, [auth?.token, dispatch]);

  /* ===================== API ===================== */
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUserQuery();

  const [createConversation] = useCreateOrGetConversationMutation();

  const conversationsArray = Array.isArray(conversations) ? conversations : [];

  /* ===================== FILTERS ===================== */
  const filteredConversations = conversationsArray.filter((conv) =>
    conv.members.some((member) =>
      member.name?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const filteredUsers = allUsers.filter((user) => {
    if (!profile) return false;
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    return user.id !== profile.id && matchesSearch;
  });

  /* ===================== HELPERS ===================== */
  const isUserOnline = (userId: string) =>
    presenceList[userId]?.isOnline === true;

  console.log("🟢 presence", presenceList);
  console.log("🟢 onlineUsers", onlineUsers);

  const hasConversationWithUser = (userId: string) =>
    conversationsArray.some((conv) =>
      conv.members.some((member) => member.id === userId)
    );

  const handleStartNewChat = async (userId: string) => {
    try {
      const result = await createConversation({ userId }).unwrap();
      const convId = result.id;

      if (!convId) {
        console.error("CreateConversation returned no id", result);
        return;
      }

      onSelectConversation(convId);

      setActiveTab("conversations");
    } catch (err) {
      console.error("Create conversation failed", err);
    }
  };

  /* ===================== LOADING ===================== */
  if (profileLoading || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="animate-spin w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  /* ===================== UI ===================== */
  return (
    <div className="h-full flex flex-col">
      {/* ================= HEADER ================= */}
      <div className="p-4 border-b flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-semibold">
              {profile.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="font-semibold text-blue-600">
              {profile.name.split(" ")[0]}
            </h1>
            <p className="text-xs text-gray-500 capitalize">
              {profile.position}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <LogOut />
        </button>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("conversations")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm ${
            activeTab === "conversations"
              ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
              : "text-gray-500"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Conversations ({conversationsArray.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm ${
            activeTab === "users"
              ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
              : "text-gray-500"
          }`}
        >
          <Users className="w-4 h-4" />
          Users ({allUsers.length - 1})
        </button>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "conversations" ? (
          filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              No conversations
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherUser = conv.members.find((m) => m.id !== profile.id);
              const convId = getConvId(conv);
              const isSelected = selectedConvId === convId;
              const unread = unreadCounts[convId] || 0;

              return (
                <div
                  key={convId}
                  onClick={() => {
                    if (!convId) return;
                    onSelectConversation(convId);
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                    isSelected || unread > 0
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {otherUser?.name?.charAt(0) || "U"}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          otherUser && isUserOnline(otherUser.id)
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-semibold truncate">
                          {otherUser?.name || "Unknown"}
                        </h3>
                      </div>

                      {conv.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage.text}
                        </p>
                      )}
                    </div>
                  </div>

                  {unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                      {unread}
                    </span>
                  )}
                </div>
              );
            })
          )
        ) : usersLoading ? (
          <div className="p-8 text-center">Loading users…</div>
        ) : (
          filteredUsers.map((user) => {
            const hasChat = hasConversationWithUser(user.id);

            return (
              <div key={user.id} className="p-4 border-b flex justify-between">
                <div className="flex gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isUserOnline(user.id) ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-xs text-gray-500">{user.position}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartNewChat(user.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    hasChat
                      ? "bg-gray-100 text-gray-700"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {hasChat ? "Open Chat" : "Message"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
