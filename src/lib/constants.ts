// Application-wide constants

// URLs and Domains
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.patchplay.live'
export const APP_NAME = 'PatchPlay'
export const APP_TAGLINE = 'devlogs • playtests • proof'

// Email
export const EMAIL_FROM = 'PatchPlay <noreply@patchplay.live>'

// Route Helpers
export function getGameUrl(slug: string | null | undefined, id: string): string {
  return slug ? `/g/${slug}` : `/game/${id}`
}

export function getGameUrlWithTab(
  slug: string | null | undefined, 
  id: string, 
  tab: string, 
  params?: Record<string, string>
): string {
  const baseUrl = getGameUrl(slug, id)
  const queryParams = new URLSearchParams({ tab, ...params })
  return `${baseUrl}?${queryParams.toString()}`
}

export function getFormUrl(formSlug: string | null | undefined, projectId: string): string {
  return `/f/${formSlug || projectId}`
}

export function getUpdateUrl(gameSlug: string, versionSlug: string): string {
  return `/updates/${gameSlug}/${versionSlug}`
}

// Tab Names
export const GAME_TABS = {
  UPDATES: 'updates',
  ANALYTICS: 'analytics',
  FEEDBACK: 'feedback',
  FORUM: 'forum',
  GALLERY: 'gallery',
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  FEEDBACK_COMMENT: 'FEEDBACK_COMMENT',
  FEEDBACK_STATUS: 'FEEDBACK_STATUS',
  FEEDBACK_REPLY: 'FEEDBACK_REPLY',
  UPDATE_PUBLISHED: 'UPDATE_PUBLISHED',
  FORM_RELEASED: 'FORM_RELEASED',
} as const

// Visibility Options
export const VISIBILITY = {
  PUBLIC: 'PUBLIC',
  UNLISTED: 'UNLISTED',
  PRIVATE: 'PRIVATE',
} as const

// User Roles
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const

// Verification
export const VERIFICATION_CODE_LENGTH = 6
export const VERIFICATION_CODE_EXPIRY_MINUTES = 15
export const PASSWORD_RESET_EXPIRY_HOURS = 1
export const MIN_PASSWORD_LENGTH = 6

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// File Upload Limits (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

// Social Share URLs
export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}

export function getTwitterShareUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

export function getLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

// Date Formatting
export const DATE_FORMAT = 'MMM d, yyyy'
export const DATETIME_FORMAT = 'MMM d, yyyy h:mm a'
export const TIME_FORMAT = 'h:mm a'
