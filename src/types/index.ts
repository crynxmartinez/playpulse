// Shared type definitions for PlayPulse

export interface User {
  id: string
  email: string
  name: string | null
}

export interface Project {
  id: string
  name: string
  slug: string | null
  subtitle?: string | null
  description?: string | null
  visibility: Visibility
  bannerUrl?: string | null
  logoUrl?: string | null
  genre?: string | null
  tags?: string[]
  steamUrl?: string | null
  itchUrl?: string | null
  websiteUrl?: string | null
  discordUrl?: string | null
  rules?: string | null
  features?: string[]
  user?: {
    displayName?: string | null
    username?: string | null
    studioName?: string | null
  }
  versions?: ProjectVersion[]
  forms?: ProjectForm[]
  pinnedSections?: PinnedSection[]
  _count?: {
    forms?: number
    stats?: number
    versions?: number
  }
}

export interface PinnedSection {
  id: string
  type: 'SNAPSHOT' | 'ANALYTICS' | string
  title?: string | null
  order: number
  snapshot?: {
    id: string
    name: string
    type: string
    imageData: string
  } | null
  widgetType?: string | null
  widgetConfig?: unknown
}

export interface ProjectVersion {
  id: string
  version: string
  title: string
  description?: string | null
  imageUrl?: string | null
  isPublished: boolean
  publishedAt?: Date | string | null
  createdAt: Date | string
}

export interface ProjectForm {
  id: string
  title: string
  slug?: string | null
  isActive: boolean
}

export type Visibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC'

export const VISIBILITY_CONFIG = {
  PUBLIC: {
    label: 'Public',
    className: 'text-green-600 border-green-200 bg-green-50',
  },
  UNLISTED: {
    label: 'Unlisted',
    className: 'text-yellow-600 border-yellow-200 bg-yellow-50',
  },
  PRIVATE: {
    label: 'Private',
    className: 'bg-muted',
  },
} as const

// Game type for sidebar (extends Project with optional visibility)
export interface Game {
  id: string
  name: string
  description: string | null
  visibility?: Visibility
}
