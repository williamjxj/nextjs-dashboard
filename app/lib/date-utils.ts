/**
 * Date formatting utilities to prevent hydration mismatches
 */

export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Use a consistent format that works on both server and client
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTimeForDisplay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Use a consistent format that works on both server and client
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Format for HTML date input (YYYY-MM-DD)
  return dateObj.toISOString().split("T")[0];
}

export function isValidDate(date: unknown): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safe date formatter that handles potential hydration issues
 * by using a consistent format and handling edge cases
 */
export function safeFormatDate(date: Date | string | null | undefined): string {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (!isValidDate(dateObj)) {
      return "";
    }

    // Use toLocaleDateString with explicit options to ensure consistency
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC", // Use UTC to avoid timezone differences
    });
  } catch (error) {
    console.warn("Date formatting error:", error);
    return "";
  }
}

/**
 * Safe date-time formatter for payment timestamps
 */
export function safeFormatDateTime(
  date: Date | string | null | undefined
): string {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (!isValidDate(dateObj)) {
      return "";
    }

    // Use toLocaleDateString with explicit options to ensure consistency
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC", // Use UTC to avoid timezone differences
    });
  } catch (error) {
    console.warn("DateTime formatting error:", error);
    return "";
  }
}
