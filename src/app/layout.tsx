import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Proivder from "@/context/Proivder";
import ReduxProvider from "@/redux/provider";
import ChatButton from "@/components/chat/ChatButton";
import FCMProvider from "@/providers/FCMProvider";
import { Toaster } from "react-hot-toast";

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
            <FCMProvider>
              {children}
              <ChatButton />
              <Toaster position="top-center" />
            </FCMProvider>
          </Proivder>
        </ReduxProvider>
      </body>
    </html>
  );
}
