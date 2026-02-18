import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip HTML tags from a string and normalize whitespace
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, ' ')  // Replace <br> with space
    .replace(/<\/div>/gi, ' ')      // Replace </div> with space
    .replace(/<[^>]*>/g, '')        // Remove all other HTML tags
    .replace(/&nbsp;/gi, ' ')       // Replace &nbsp; with space
    .replace(/&amp;/gi, '&')        // Decode &amp;
    .replace(/&lt;/gi, '<')         // Decode &lt;
    .replace(/&gt;/gi, '>')         // Decode &gt;
    .replace(/\s+/g, ' ')           // Normalize multiple spaces to single
    .trim()
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength: number = 200): string {
  const cleaned = stripHtml(text)
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.slice(0, maxLength).trim() + '...'
}
