import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { firebaseApp } from './firebase'
import type { GalleryImage, GalleryTag } from '../types'

export const slugify = (tag: string) =>
  tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const buildTags = (images: GalleryImage[]): GalleryTag[] => {
  const counts = new Map<string, number>()
  images.forEach((image) => {
    image.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
  })
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count, slug: slugify(tag) }))
    .sort((a, b) => a.tag.localeCompare(b.tag))
}

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate()
  }
  return new Date()
}

export async function loadPublicImages(): Promise<GalleryImage[]> {
  if (!firebaseApp) return []

  const db = getFirestore(firebaseApp)
  const imagesQuery = query(
    collection(db, 'images'),
    where('visibility', '==', 'public'),
    where('status', '==', 'ready'),
    orderBy('sortAt', 'desc'),
    limit(80),
  )
  const snapshot = await getDocs(imagesQuery)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      title: String(data.title ?? 'Untitled'),
      description: String(data.description ?? ''),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      visibility: data.visibility === 'private' ? 'private' : 'public',
      status: data.status === 'ready' ? 'ready' : 'failed',
      displayUrl: String(data.displayUrl ?? ''),
      thumbUrl: String(data.thumbUrl ?? data.displayUrl ?? ''),
      width: Number(data.width ?? 1),
      height: Number(data.height ?? 1),
      sortAt: parseDate(data.sortAt),
      takenAt: data.takenAt ? parseDate(data.takenAt) : undefined,
    }
  })
}
