import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Proivder from "@/context/Proivder";
import ReduxProvider from "@/redux/provider";
import ChatButton from "@/components/chat/ChatButton";
import { SocketProvider } from "@/providers/SocketProvider";
import NotificationBell from "@/components/notification/NotificationBell";
import { ToastProvider } from "@/providers/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Attendace App | SDEG",
  description:
    "Application for recodring the attendance of companys' employess",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <Proivder>
            <SocketProvider>
              <NotificationBell />
              <ToastProvider />
              {children}
              <ChatButton />
            </SocketProvider>
          </Proivder>
        </ReduxProvider>
      </body>
    </html>
  );
}
