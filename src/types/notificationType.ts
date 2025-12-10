export type TPagination = {
  currentPage: number;
  totalPages: number;
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};

export type TNotification = {
  title: string;
  id: string;
  message: string;
  refId: string;
  module:
    | "system"
    | "loads"
    | "trucks"
    | "drivers"
    | "identity"
    | "maintenance"
    | "chat";
  importance: "low" | "medium" | "high";
  from: string;
  toRole: string;
  toUser: {
    id: string;
    name: string;
  };
  status: "unread" | "read";
  createdAt: string;
  updatedAt: string;
};
export interface TNotificationsResponse {
  data: TNotification[];
  paginationResult: TPagination;
}
