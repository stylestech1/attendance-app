'use client'
import { useAppSelector } from "@/redux/store";
import { socketService } from "@/services/socketService";
import { Inter } from "next/font/google";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = useAppSelector((state) => state.auth.token);
  
  useEffect(() => {
    if (!token) return;
    
    const socket = socketService.initialize(token);
    
    return () => {
      socketService.disconnect();
    };
  }, [token]);
  return (
    <div className={inter.className}>
      {children}
    </div>
  );
}