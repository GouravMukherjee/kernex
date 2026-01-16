import { formatDistanceToNow, format, formatDuration, intervalToDuration } from 'date-fns';

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date as full date-time (e.g., "Jan 15, 2026 at 3:30 PM")
 */
export function formatFullDateTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM dd, yyyy \'at\' h:mm a');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date only (e.g., "Jan 15, 2026")
 */
export function formatDateOnly(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format time only (e.g., "3:30 PM")
 */
export function formatTimeOnly(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'h:mm a');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format duration (e.g., "4 hours 32 minutes")
 */
export function formatDurationString(startDate: Date, endDate: Date): string {
  try {
    const duration = intervalToDuration({ start: startDate, end: endDate });
    return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
  } catch {
    return 'N/A';
  }
}

/**
 * Format duration to short format (e.g., "4h 32m")
 */
export function formatDurationShort(startDate: Date, endDate: Date): string {
  try {
    const duration = intervalToDuration({ start: startDate, end: endDate });
    const hours = duration.hours ?? 0;
    const minutes = duration.minutes ?? 0;
    const seconds = duration.seconds ?? 0;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  } catch {
    return 'N/A';
  }
}

/**
 * Format bytes to human-readable format (e.g., "1.2 GB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
