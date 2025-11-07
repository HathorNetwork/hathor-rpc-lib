/**
 * Timelock utility functions for handling date/time conversions and validations
 */

/**
 * Converts a Date object to a Unix timestamp (seconds since epoch)
 */
export const dateToUnixTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

/**
 * Converts a Unix timestamp to a Date object
 */
export const unixTimestampToDate = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};

/**
 * Checks if a date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

/**
 * Checks if a Unix timestamp is in the future
 */
export const isFutureTimestamp = (timestamp: number): boolean => {
  return timestamp > Math.floor(Date.now() / 1000);
};

/**
 * Formats a Unix timestamp to a human-readable string in the user's local timezone
 */
export const formatTimelockDate = (timestamp: number): string => {
  const date = unixTimestampToDate(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

/**
 * Gets the user's timezone offset in hours
 */
export const getTimezoneOffset = (): string => {
  const offset = -new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Gets the user's timezone name
 */
export const getTimezoneName = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
