"use client";
import { SocketProvider } from "@/providers/SocketProvider";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={inter.className}>
      <SocketProvider>{children}</SocketProvider>
    </div>
  );
}
