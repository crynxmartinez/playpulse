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
  description: string | null
  visibility: Visibility
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
