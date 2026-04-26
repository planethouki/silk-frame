import type { User } from 'firebase/auth'

export type ImageRating = 1 | 2 | 3 | 4 | 5 | null

export type GalleryImage = {
  id: string
  title: string
  description: string
  tags: string[]
  visibility: 'public' | 'private'
  status: 'uploading' | 'ready' | 'failed'
  displayUrl: string
  thumbUrl: string
  width: number
  height: number
  heartRating: ImageRating
  starRating: ImageRating
  sortAt: Date
  takenAt?: Date
}

export type GalleryTag = {
  tag: string
  count: number
  slug: string
}

export type LoadState = 'loading' | 'ready' | 'offline'

export type AdminSession = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOutAdmin: () => Promise<void>
  hasFirebaseConfig: boolean
}
