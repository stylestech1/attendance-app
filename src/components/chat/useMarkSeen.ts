import { useAuth } from "@/context/AuthContext";
import { markMessageSeen } from "@/redux/features/chatSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { socketService } from "@/services/socketService";
import { useEffect } from "react";

export const useMarkMessagesSeen = (conversationId: string | null) => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(
    (state) => state.chat.liveMessages[conversationId || ""] || []
  );
  const { auth } = useAuth();
  const currentUserId = auth.id;

  const markAsSeen = () => {
    if (!conversationId) return;

    const hasUnseen = messages.some(
      (msg) => !msg.seen && msg.sender?.id !== currentUserId
    );

    if (!hasUnseen) return;
    if (!currentUserId) return;

    dispatch(
      markMessageSeen({
        conversationId,
        currentUserId,
      })
    );

    socketService.markSeen(conversationId);
  };

  useEffect(() => {
    markAsSeen();

    const handleFocus = () => markAsSeen();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [conversationId]);

  return { markAsSeen };
};
