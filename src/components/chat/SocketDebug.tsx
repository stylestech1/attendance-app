"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/services/socketService";
import { Conversation } from "@/types/chat";

export default function SocketDebug() {
  const [status, setStatus] = useState({
    connected: false,
    id: null as string | null,
    events: [] as string[],
  });

  // useEffect(() => {
  //   const socket = socketService.getSocket();

  //   const handleConnect = () => {
  //     console.log("✅ Socket Debug: Connected", socket?.id);
  //     setStatus(prev => ({ ...prev, connected: true, id: socket?.id || null }));
  //   };

  //   const handleDisconnect = () => {
  //     console.log("🔌 Socket Debug: Disconnected");
  //     setStatus(prev => ({ ...prev, connected: false, id: null }));
  //   };

  //   const handleAnyEvent = (eventName: string, ...args: Conversation[]) => {
  //     console.log(`📡 Socket Debug: Event ${eventName}`, args);
  //     setStatus(prev => ({
  //       ...prev,
  //       events: [eventName, ...prev.events.slice(0, 4)], // Keep last 5 events
  //     }));
  //   };

  //   // Listen to all events
  //   socket?.onAny(handleAnyEvent);
  //   socket?.on("connect", handleConnect);
  //   socket?.on("disconnect", handleDisconnect);

  //   // Set initial state
  //   setStatus({
  //     connected: socket?.connected || false,
  //     id: socket?.id || null,
  //     events: [],
  //   });

  //   return () => {
  //     socket?.offAny(handleAnyEvent);
  //     socket?.off("connect", handleConnect);
  //     socket?.off("disconnect", handleDisconnect);
  //   };
  // }, []);

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-black/90 text-white p-3 rounded-lg text-xs max-w-sm">
      <div className="font-bold mb-2">Socket Debug</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {status.id && (
          <div>ID: {status.id}</div>
        )}
        <div className="mt-2">
          <div className="font-semibold">Recent Events:</div>
          {status.events.length === 0 ? (
            <div className="text-gray-400">No events yet</div>
          ) : (
            <div className="space-y-1 mt-1">
              {status.events.map((event, idx) => (
                <div key={idx} className="truncate">• {event}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}