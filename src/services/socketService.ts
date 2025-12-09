// services/socketService.ts
import { Conversation } from "@/types/chat";
import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/constants/socketEvents";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class SocketServiceClass {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, ((...args: Conversation[]) => void)[]> =
    new Map();
  private listenersRegistered = false;

  initialize(token: string) {
    if (this.socket) {
      console.log("📡 Socket already connected");
      this.setupEventListeners();
      return this.socket;
    }

    this.token = token;

    console.log("🚀 Initializing socket connection to:", API_BASE_URL);

    this.socket = io(API_BASE_URL!, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      withCredentials: true,
      query: { token },
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket || this.listenersRegistered) return;

    this.listenersRegistered = true;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully. ID:", this.socket?.id);
      console.log("🔗 Socket connected:", this.socket?.connected);
      console.log("🔐 Auth:", this.socket?.auth);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      console.error("❌ Error details:", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected. Reason:", reason);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected. Attempt:", attemptNumber);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("🔄 Socket reconnect error:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnect failed");
    });

    // Listen for specific chat events
    this.socket.on(SOCKET_EVENTS.NEW_MESSAGE, (data) => {
      console.log("📨 Received newMessage event:", data);
    });

    this.socket.on(SOCKET_EVENTS.TYPING, (data) => {
      console.log("✍️ Received typing event:", data);
    });

    this.socket.on(SOCKET_EVENTS.STOP_TYPING, (data) => {
      console.log("🤚 Received stopTyping event:", data);
    });
  }

  // Emit events
  emit<T = Conversation>(event: string, data: T) {
    if (!this.socket?.connected) {
      console.error("⚠️ Cannot emit", event, "- Socket not connected");
      return false;
    }

    console.log(`📤 Emitting ${event}:`, data);
    this.socket.emit(event, data);
    return true;
  }

  // Listen to events
  on(event: string, callback: (...args: Conversation[]) => void) {
    if (!this.socket) {
      console.error("⚠️ Cannot listen to", event, "- Socket not initialized");
      return;
    }

    this.socket.on(event, callback);

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback?: (...args: Conversation[]) => void) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getId() {
    return this.socket?.id || null;
  }
}

export const socketService = new SocketServiceClass();
