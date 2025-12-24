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
  ChevronLeft,
  Mail,
  UserPlus,
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
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  /* ===================== UI ===================== */
  return (
    <div className="h-full flex flex-col overflow-x-hidden bg-gradient-to-b from-white to-gray-50/50">
      {/* ================= HEADER ================= */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">
                  {profile.name.charAt(0)}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{profile.name}</h1>
              <p className="text-sm text-gray-600 capitalize flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {profile.position}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white hover:bg-gray-50 shadow-sm border border-gray-100 text-gray-700 hover:text-gray-900 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex border-b border-gray-100 bg-white px-2">
        <button
          onClick={() => setActiveTab("conversations")}
          className={`flex-1 py-4 flex items-center justify-center gap-2.5 text-sm font-medium relative transition-all duration-200 ${
            activeTab === "conversations"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageCircle className="w-4.5 h-4.5" />
          Conversations
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {conversationsArray.length}
          </span>
          {activeTab === "conversations" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-4 flex items-center justify-center gap-2.5 text-sm font-medium relative transition-all duration-200 ${
            activeTab === "users"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Users
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {allUsers.length - 1}
          </span>
          {activeTab === "users" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* ================= SEARCH ================= */}
      <div className="px-5 py-4 bg-white">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations or users..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {activeTab === "conversations" ? (
          filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-inner">
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-2">No conversations yet</h3>
              <p className="text-gray-500 text-sm text-center max-w-xs">
                {search ? "No conversations match your search." : "Start a conversation by selecting a user from the Users tab."}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherUser = conv.members.find((m) => m.id !== profile.id);
              const convId = getConvId(conv);
              const isSelected = selectedConvId === convId;
              const unread = unreadCounts[convId] || 0;
              const isOnline = otherUser && isUserOnline(otherUser.id);

              return (
                <div
                  key={convId}
                  onClick={() => {
                    if (!convId) return;
                    onSelectConversation(convId);
                  }}
                  className={`p-4 mb-2 rounded-xl cursor-pointer transition-all duration-200 flex justify-between items-center ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm"
                      : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow"
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner">
                        <span className="font-semibold text-blue-700">
                          {otherUser?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {otherUser?.name || "Unknown"}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {conv.lastMessage ? (
                        <p className="text-sm text-gray-600 truncate w-50">
                          {conv.lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No messages yet</p>
                      )}
                    </div>
                  </div>

                  {unread > 0 && (
                    <div className="ml-2">
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-xs font-semibold min-w-6 h-6 flex items-center justify-center shadow">
                        {unread}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : usersLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading users...</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const hasChat = hasConversationWithUser(user.id);
            const isOnline = isUserOnline(user.id);

            return (
              <div 
                key={user.id} 
                className="p-4 mb-2 rounded-xl bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow transition-all duration-200 flex justify-between items-center"
              >
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner">
                      <span className="font-semibold text-blue-700">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                        isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate w-25">{user.name}</h3>
                      {isOnline && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Online
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate w-25">{user.position}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartNewChat(user.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    hasChat
                      ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 shadow-sm"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {hasChat ? (
                    <>
                      <Mail className="w-4 h-4" />
                      Open
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Message
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ================= FOOTER ================= */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            <span className="font-medium">{conversationsArray.length}</span> conversations •{" "}
            <span className="font-medium">{filteredUsers.length}</span> users online
          </div>
          <button
            onClick={() => logout && logout()}
            className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}