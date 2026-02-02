import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the start of the "day" based on user's dayResetHour preference.
 * For night owls who study past midnight, this allows their study time
 * to count towards the previous calendar day.
 * 
 * @param dayResetHour - Hour (0-23) when the user's day resets (default: 0 = midnight)
 * @param date - Optional date to get day start for (default: now)
 * @returns Date object representing the start of the user's "day"
 * 
 * Example: If dayResetHour is 4 (4 AM) and current time is 2 AM on Jan 2nd,
 * the function returns 4 AM on Jan 1st (previous calendar day at reset hour)
 */
export function getDayStart(dayResetHour: number = 0, date?: Date): Date {
  const now = date ? new Date(date) : new Date()
  const currentHour = now.getHours()
  
  // Create a date at the reset hour
  const dayStart = new Date(now)
  dayStart.setHours(dayResetHour, 0, 0, 0)
  
  // If current time is before the reset hour, we're still in "yesterday"
  // E.g., if reset is 4 AM and it's 2 AM, we should use yesterday's 4 AM
  if (currentHour < dayResetHour) {
    dayStart.setDate(dayStart.getDate() - 1)
  }
  
  return dayStart
}

/**
 * Get the end of the "day" based on user's dayResetHour preference.
 * 
 * @param dayResetHour - Hour (0-23) when the user's day resets (default: 0 = midnight)
 * @param date - Optional date to get day end for (default: now)
 * @returns Date object representing the end of the user's "day"
 */
export function getDayEnd(dayResetHour: number = 0, date?: Date): Date {
  const dayStart = getDayStart(dayResetHour, date)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  return dayEnd
}

/**
 * Check if a date falls within the current "day" based on user's dayResetHour.
 * 
 * @param date - Date to check
 * @param dayResetHour - Hour (0-23) when the user's day resets (default: 0 = midnight)
 * @returns boolean indicating if the date is within today's boundaries
 */
export function isToday(date: Date, dayResetHour: number = 0): boolean {
  const dayStart = getDayStart(dayResetHour)
  const dayEnd = getDayEnd(dayResetHour)
  const checkDate = new Date(date)
  return checkDate >= dayStart && checkDate < dayEnd
}

/**
 * Optimize Appwrite storage image URL with resize and format conversion
 * Uses /preview endpoint which supports image transformations
 * @param url - Original Appwrite storage URL
 * @param width - Desired width (will be 2x for retina)
 * @param height - Desired height (will be 2x for retina)
 * @returns Optimized image URL with WebP format and proper dimensions
 */
export function optimizeImageUrl(url: string, width: number, height: number): string {
  if (!url) return url
  // Replace /view with /preview to enable image transformations
  const previewUrl = url.replace('/view', '/preview')
  const separator = previewUrl.includes('?') ? '&' : '?'
  // Use 2x dimensions for retina displays
  return `${previewUrl}${separator}width=${width * 2}&height=${height * 2}&output=webp&quality=80`
}