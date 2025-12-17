import { format, differenceInHours } from "date-fns";

export const formatLastSeen = (lastSeen?: string, isOnline?: boolean) => {
  if (isOnline) return "Online";
  if (!lastSeen) return "Offline";

  const lastSeenDate = new Date(lastSeen);
  const diffHours = differenceInHours(new Date(), lastSeenDate);

  if (diffHours < 24) {
    return `Last seen at ${format(lastSeenDate, "h:mm a")}`;
  }

  return `Last seen on ${format(lastSeenDate, "dd/MM/yyyy")}`;
};
