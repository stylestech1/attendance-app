"use client";

import { useEffect } from "react";
import { useMarkMessagesSeenMutation } from "@/redux/api/chatApi";
import { useAppSelector } from "@/redux/store";

export const useMarkMessagesSeen = (conversationId: string | null) => {
  const [markSeen] = useMarkMessagesSeenMutation();
  const messages = useAppSelector(
    (state) => state.chat.liveMessages[conversationId || ""] || []
  );

  useEffect(() => {
    if (!conversationId) return;

    const hasUnseenMessages = messages.some(msg => !msg.seen);
    
    if (hasUnseenMessages) {
      const markAsSeen = async () => {
        try {
          await markSeen({ conversationId }).unwrap();
          console.log("✅ Messages marked as seen for conversation:", conversationId);
        } catch (error) {
          console.error("❌ Failed to mark messages as seen:", error);
        }
      };

      // Mark as seen immediately
      markAsSeen();

      // Mark as seen when window gains focus
      const handleFocus = () => {
        markAsSeen();
      };

      window.addEventListener("focus", handleFocus);

      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [conversationId, messages, markSeen]);

  return null;
};