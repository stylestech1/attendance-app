"use client";
import { SocketProvider } from "@/providers/SocketProvider";
import { useChatSocket } from "@/services/useChatSocket";
import { Inter } from "next/font/google";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* ===================== SOCKET ===================== */
  const { getPresenceList } = useChatSocket();

  useEffect(() => {
    getPresenceList?.();
  }, [getPresenceList]);

  return (
    <div className={inter.className}>
      <SocketProvider>{children}</SocketProvider>
    </div>
  );
}
