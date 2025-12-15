"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/services/socketService";
import { RootState, useAppSelector } from "@/redux/store";
import { useChatSocket } from "@/services/useChatSocket";

export default function SocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const token = useAppSelector((state: RootState) => state.auth.token);
    // const { isInitialized } = useChatSocket();
  

  // useEffect(() => {
  //   if (!token) {
  //     console.log("⏸️ No token, skipping socket connection");
  //     return;
  //   }

  //   const socket = socketService.getSocket();

  //   const checkConnection = () => {
  //     if (socket?.connected) {
  //       console.log("✅ Socket is connected");
  //       isInitialized.current = true;
  //     } else {
  //       console.log("⚠️ Socket initialized but not connected yet");
  //       setTimeout(() => {
  //         if (socket && !socket.connected) {
  //           console.log("🔄 Attempting to reconnect socket...");
  //           socket.connect();
  //         }
  //       }, 1000);
  //     }
  //   };

  //   checkConnection();

  //   const handleConnect = () => {
  //     setIsConnected(true);
  //     setSocketId(socket?.id || null);
  //   };

  //   const handleDisconnect = () => {
  //     setIsConnected(false);
  //     setSocketId(null);
  //   };

  //   socket?.on("connect", handleConnect);
  //   socket?.on("disconnect", handleDisconnect);

  //   // Set initial state
  //   setIsConnected(socket?.connected || false);
  //   setSocketId(socket?.id || null);

  //   return () => {
  //     socket?.off("connect", handleConnect);
  //     socket?.off("disconnect", handleDisconnect);
  //   };
  // }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-black/80 text-white px-3 py-1 rounded-full text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span>{isConnected ? "Connected" : "Disconnected"}</span>
      {socketId && (
        <span className="text-xs opacity-75">({socketId.substring(0, 5)})</span>
      )}
    </div>
  );
}
