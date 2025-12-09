// providers/SocketProvider.tsx
'use client'
import { socketService } from "@/services/socketService";
import { useAppSelector } from "@/redux/store";
import { useEffect } from "react";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  
  useEffect(() => {
    if (!token) {
      console.log("⏸️ No token, skipping socket connection");
      return;
    }
    
    console.log("🚀 Initializing socket in SocketProvider");
    const socket = socketService.initialize(token);
    
    return () => {
      console.log("🔌 Disconnecting socket from SocketProvider");
      socketService.disconnect();
    };
  }, [token]);
  
  return <>{children}</>;
}