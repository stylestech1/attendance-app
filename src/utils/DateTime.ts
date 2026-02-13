export const formatToCairoTime = (
    dateString: string,
    hour12: boolean = true
): string => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12,
    }).format(new Date(dateString));
};
