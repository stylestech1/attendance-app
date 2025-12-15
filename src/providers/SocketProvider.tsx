'use client'
import { socketService } from "@/services/socketService";
import { useAppSelector } from "@/redux/store";
import { useEffect } from "react";
import { notificationService } from "@/services/notificationService";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  
  useEffect(() => {
    if (!token) {
      console.log("⏸️ No token, skipping socket connection");
      return;
    }
    
    console.log("🚀 Initializing socket in SocketProvider");
    socketService.initialize(token);
    // notificationService.initialize();
    
    return () => {
      console.log("🔌 Disconnecting socket from SocketProvider");
      socketService.disconnect();
      // notificationService.cleanup();
    };
  }, [token]);
  
  return <>{children}</>;
}