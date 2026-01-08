import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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