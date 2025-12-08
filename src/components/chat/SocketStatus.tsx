"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/services/socketService";

export default function SocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const socket = socketService.getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket?.id || null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    socket?.on("connect", handleConnect);
    socket?.on("disconnect", handleDisconnect);

    // Set initial state
    setIsConnected(socket?.connected || false);
    setSocketId(socket?.id || null);

    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-black/80 text-white px-3 py-1 rounded-full text-sm">
      <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
      <span>{isConnected ? "Connected" : "Disconnected"}</span>
      {socketId && (
        <span className="text-xs opacity-75">({socketId.substring(0, 5)})</span>
      )}
    </div>
  );
}