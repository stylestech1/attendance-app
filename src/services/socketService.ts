import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { Conversation, Message } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listenersRegistered = false;

  // event -> callbacks
  private eventCallbacks: Map<string, Set<Listener>> = new Map();

  /* -------------------------------------------------------------------------- */
  /*                               INITIALIZATION                               */
  /* -------------------------------------------------------------------------- */

  initialize(token: string) {
    if (this.socket?.connected && this.token === token) {
      console.log("📡 Socket already initialized");
      return this.socket;
    }

    this.token = token;

    console.log("🚀 Initializing socket connection:", API_BASE_URL);

    this.socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      withCredentials: true,
    });

    this.registerCoreListeners();
    return this.socket;
  }

  /* -------------------------------------------------------------------------- */
  /*                               CORE LISTENERS                                */
  /* -------------------------------------------------------------------------- */

  private registerCoreListeners() {
    if (!this.socket || this.listenersRegistered) return;
    this.listenersRegistered = true;

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("✅ Socket connected:", this.socket?.id);
      this.emitInternal(SOCKET_EVENTS.USER_ONLINE, {});
      this.emitInternal(SOCKET_EVENTS.PRESENCE_LIST, {});
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Socket connect error:", err.message);
    });

    this.socket.on(SOCKET_EVENTS.SOCKET_ERROR, (error) => {
      console.error("🚨 Socket error:", error);
    });

    // 🔁 Dispatch all registered callbacks
    Object.values(SOCKET_EVENTS).forEach((event) => {
      this.socket?.on(event, (...args) => {
        this.eventCallbacks.get(event)?.forEach((cb) => cb(...args));
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                EVENT SYSTEM                                 */
  /* -------------------------------------------------------------------------- */

  on(event: string, callback: Listener) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }

    this.eventCallbacks.get(event)!.add(callback);

    return () => {
      this.eventCallbacks.get(event)?.delete(callback);
    };
  }

  off(event: string, callback?: Listener) {
    if (!callback) {
      this.eventCallbacks.delete(event);
      return;
    }

    this.eventCallbacks.get(event)?.delete(callback);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   EMIT                                      */
  /* -------------------------------------------------------------------------- */

  emit<T = Conversation>(event: string, payload?: T) {
    if (!this.socket) return;

    if (!this.socket.connected) {
      console.warn("⏳ Queued emit until connected:", event);

      this.socket.once(SOCKET_EVENTS.CONNECT, () => {
        this.socket?.emit(event, payload);
      });

      return;
    }

    this.socket.emit(event, payload);
  }

  // internal emits (used inside service)
  private emitInternal<T = Conversation>(event: string, payload?: T) {
    this.socket?.emit(event, payload);
  }

  /* -------------------------------------------------------------------------- */
  /*                             CHAT HELPERS                                    */
  /* -------------------------------------------------------------------------- */

  joinConversation(conversationId: string) {
    this.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
  }

  sendMessage(conversationId: string, text: string) {
    this.emit(SOCKET_EVENTS.SEND_MESSAGE, { conversationId, text });
  }

  markSeen(conversationId: string) {
    this.emit(SOCKET_EVENTS.MARK_SEEN, { conversationId });
  }

  startTyping(conversationId: string) {
    this.emit(SOCKET_EVENTS.TYPING, { conversationId });
  }

  stopTyping(conversationId: string) {
    this.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
  }

  getPresenceList() {
    this.emit(SOCKET_EVENTS.PRESENCE_LIST);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 CLEANUP                                     */
  /* -------------------------------------------------------------------------- */

  disconnect() {
    if (!this.socket) return;

    console.log("🧹 Cleaning up socket service");

    this.socket.removeAllListeners();
    this.socket.disconnect();

    this.socket = null;
    this.token = null;
    this.listenersRegistered = false;
    this.eventCallbacks.clear();
  }

  /* -------------------------------------------------------------------------- */
  /*                                  GETTERS                                    */
  /* -------------------------------------------------------------------------- */

  isConnected() {
    return this.socket?.connected ?? false;
  }

  getId() {
    return this.socket?.id ?? null;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
