import type { User } from 'firebase/auth'

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
