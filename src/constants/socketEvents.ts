export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Conversations
  JOIN_CONVERSATION: "joinConversation",
  LEAVE_CONVERSATION: "leaveConversation",
  CONVERSATION_JOINED: "conversationJoined",
  CONVERSATION_LEFT: "conversationLeft",

  // Messages
  SEND_MESSAGE: "sendMessage",
  NEW_MESSAGE: "newMessage",

  // Typing
  TYPING: "typing",
  STOP_TYPING: "stopTyping",

  // Seen status
  MARK_SEEN: "markSeen",
  SEEN_UPDATE: "seenUpdate",
  SEEN_ACKNOWLEDGED: "seenAcknowledged",

  // Presence
  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  PRESENCE_LIST: "presenceList",

  // Errors
  SOCKET_ERROR: "socketError",

  // Testing
  PING: "ping",
  PONG: "pong",
};