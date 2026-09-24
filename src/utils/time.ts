// Real-time synchronization and time formatting utilities
// Handles clock drift compensation against server time, timezone conversions (Local & Malaysia MYT),
// and formatting timestamps to real-time.

let serverTimeOffsetMs = 0;
let isSynced = false;

/**
 * Synchronize client time with server real-time to eliminate clock drift.
 */
export async function syncServerTime(): Promise<number> {
  try {
    const t0 = Date.now();
    const res = await fetch("/api/time");
    const t1 = Date.now();
    if (res.ok) {
      const data = await res.json();
      const serverEpoch = data.epoch;
      const roundTrip = t1 - t0;
      // Estimated server time at t1:
      const estimatedServerTime = serverEpoch + roundTrip / 2;
      serverTimeOffsetMs = estimatedServerTime - t1;
      isSynced = true;
      return serverTimeOffsetMs;
    }
  } catch (e) {
    console.warn("Time sync fetch failed, using local device time", e);
  }
  return 0;
}

export function setServerTimeFromWS(serverEpoch: number) {
  const now = Date.now();
  serverTimeOffsetMs = serverEpoch - now;
  isSynced = true;
}

export function getSyncedNow(): number {
  return Date.now() + serverTimeOffsetMs;
}

export function getIsTimeSynced(): boolean {
  return isSynced;
}

export function getTimeOffsetMs(): number {
  return serverTimeOffsetMs;
}

export type TimezoneMode = "local" | "myt";

/**
 * Format a timestamp (ISO string, epoch number, or existing string) to real time.
 */
export function formatRealTime(
  timestamp: string | number | undefined | null,
  options?: {
    showSeconds?: boolean;
    timezone?: TimezoneMode;
    hour12?: boolean;
  }
): string {
  if (!timestamp) return "--:--";

  let date: Date;

  if (typeof timestamp === "number") {
    date = new Date(timestamp);
  } else if (typeof timestamp === "string") {
    // Check if ISO format or parseable date string
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    } else {
      // It might be a plain time string already like "08:35" or "1:30 PM"
      return timestamp;
    }
  } else {
    return "--:--";
  }

  const tz = options?.timezone === "myt" ? "Asia/Kuala_Lumpur" : undefined;
  const hour12 = options?.hour12 !== undefined ? options.hour12 : true;

  try {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      ...(options?.showSeconds ? { second: "2-digit" } : {}),
      timeZone: tz,
      hour12
    });
  } catch {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}

/**
 * Format timestamp as relative time ("just now", "2m ago", "1h ago")
 */
export function formatRelativeTime(timestamp: string | number | undefined | null): string {
  if (!timestamp) return "";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(String(timestamp));
  if (isNaN(date.getTime())) return String(timestamp);

  const now = getSyncedNow();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Format full real-time date string (e.g. "Thu, 24 Sep 2026")
 */
export function formatRealDate(date: Date = new Date(getSyncedNow()), timezone?: TimezoneMode): string {
  const tz = timezone === "myt" ? "Asia/Kuala_Lumpur" : undefined;
  try {
    return date.toLocaleDateString([], {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: tz
    });
  } catch {
    return date.toDateString();
  }
}
