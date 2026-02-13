const CAIRO_TIMEZONE = "Africa/Cairo";
export const formatToCairoTime = (dateString: string): string => {
    if (!dateString) return "";

    const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: CAIRO_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(dateString));
    //   return formatted.replace("AM", "Am").replace("PM", "Pm");
    return formatted;
};

export const formatCairoDate = (dateString: string): string => {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: CAIRO_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(dateString));

};
