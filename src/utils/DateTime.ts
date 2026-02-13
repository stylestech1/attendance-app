export const formatToCairoTime = (dateString: string): string => {
  if (!dateString) return "";

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
  return formatted.replace("AM", "Am").replace("PM", "Pm");
};
