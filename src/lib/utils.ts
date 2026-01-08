import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Optimize Appwrite storage image URL with resize and format conversion
 * @param url - Original Appwrite storage URL
 * @param width - Desired width (will be 2x for retina)
 * @param height - Desired height (will be 2x for retina)
 * @returns Optimized image URL with WebP format and proper dimensions
 */
export function optimizeImageUrl(url: string, width: number, height: number): string {
  if (!url) return url
  const separator = url.includes('?') ? '&' : '?'
  // Use 2x dimensions for retina displays
  return `${url}${separator}width=${width * 2}&height=${height * 2}&output=webp`
}