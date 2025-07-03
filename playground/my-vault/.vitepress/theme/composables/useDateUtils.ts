/**
 * Composable for date utility methods
 * Provides reusable date formatting and manipulation functions
 */

export interface DateFormatOptions {
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}

export const useDateUtils = () => {
  /**
   * Default locale and formatting options
   */
  const defaultLocale = 'it-IT';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  /**
   * Formats a timestamp to a localized date string
   * @param timestamp - The timestamp to format (string, number, or Date)
   * @param locale - The locale to use for formatting (default: 'it-IT')
   * @param options - Intl.DateTimeFormatOptions for customizing the format
   * @returns Formatted date string
   */
  const formatTimestamp = (
    timestamp: string | number | Date,
    locale: string = defaultLocale,
    options: Intl.DateTimeFormatOptions = defaultOptions
  ): string => {
    try {
      return new Date(timestamp).toLocaleDateString(locale, options);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid Date';
    }
  };

  /**
   * Formats a timestamp to include both date and time
   * @param timestamp - The timestamp to format
   * @param locale - The locale to use for formatting
   * @returns Formatted date and time string
   */
  const formatTimestampWithTime = (
    timestamp: string | number | Date,
    locale: string = defaultLocale
  ): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return formatTimestamp(timestamp, locale, options);
  };

  /**
   * Formats a timestamp to a relative time string (e.g., "2 days ago")
   * @param timestamp - The timestamp to format
   * @param locale - The locale to use for formatting
   * @returns Relative time string
   */
  const formatRelativeTime = (
    timestamp: string | number | Date,
    locale: string = defaultLocale
  ): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays > 0) {
        return `${diffInDays} ${diffInDays === 1 ? 'giorno' : 'giorni'} fa`;
      } else if (diffInHours > 0) {
        return `${diffInHours} ${diffInHours === 1 ? 'ora' : 'ore'} fa`;
      } else if (diffInMinutes > 0) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minuti'} fa`;
      } else {
        return 'Proprio ora';
      }
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Invalid Date';
    }
  };

  /**
   * Checks if a timestamp is today
   * @param timestamp - The timestamp to check
   * @returns True if the timestamp is today
   */
  const isToday = (timestamp: string | number | Date): boolean => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  };

  /**
   * Checks if a timestamp is within the last week
   * @param timestamp - The timestamp to check
   * @returns True if the timestamp is within the last 7 days
   */
  const isWithinLastWeek = (timestamp: string | number | Date): boolean => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      return diffInDays <= 7 && diffInDays >= 0;
    } catch (error) {
      return false;
    }
  };

  /**
   * Gets the start and end of a day for a given timestamp
   * @param timestamp - The timestamp
   * @returns Object with start and end Date objects
   */
  const getDayBounds = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return { start, end };
  };

  return {
    formatTimestamp,
    formatTimestampWithTime,
    formatRelativeTime,
    isToday,
    isWithinLastWeek,
    getDayBounds,
    defaultLocale,
    defaultOptions
  };
};