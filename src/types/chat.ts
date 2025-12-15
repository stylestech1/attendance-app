import { TPagination } from "./notificationType";

export type UserMini = {
  id: string;
  name?: string;
};

export type Conversation = {
  id: string;
  members: UserMini[];
  lastMessage?: Message | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[]; 
  unreadCount?: number;
};

export type Message = {
  id: string;
  conversationId: string;
  text: string;
  sender: UserMini;
  seen: boolean;
  createdAt: string;
  updatedAt?: string;
  isTemp?: boolean;
};

export type ApiResponse<T> = {
  message: string;
  results?: number;
  data: T;
  success?: boolean;
  pagination?: TPagination;
};

export type MarkSeenResponse = {
  message: string;
};

export interface Presence {
  [userId: string]: {
    isOnline: boolean;
    lastSeen?: string;
  };
}