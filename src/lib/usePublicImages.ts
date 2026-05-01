import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { hasFirebaseConfig } from './firebase'
import { loadPublicImages } from './gallery'
import type { GalleryImage, LoadState } from '../types'

const publicImagesKey = 'silk-frame.publicImages'
const publicImagesCacheKey = 'silk-frame.publicImages.v1'

type CachedGalleryImage = Omit<GalleryImage, 'sortAt' | 'takenAt'> & {
  sortAt: string
  takenAt?: string
}

const canUseLocalStorage = () => typeof window !== 'undefined' && window.localStorage

const serializeImage = (image: GalleryImage): CachedGalleryImage => ({
  ...image,
  sortAt: image.sortAt.toISOString(),
  takenAt: image.takenAt?.toISOString(),
})

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const deserializeImage = (image: CachedGalleryImage): GalleryImage | null => {
  const sortAt = parseDate(image.sortAt)
  if (!sortAt) return null

  const takenAt = image.takenAt ? parseDate(image.takenAt) : null

  return {
    ...image,
    sortAt,
    takenAt: takenAt ?? undefined,
  }
}

function loadCachedPublicImages(): GalleryImage[] {
  if (!canUseLocalStorage()) return []

  try {
    const stored = window.localStorage.getItem(publicImagesCacheKey)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((image) => deserializeImage(image as CachedGalleryImage))
      .filter((image): image is GalleryImage => Boolean(image))
  } catch {
    return []
  }
}

function saveCachedPublicImages(images: GalleryImage[]) {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.setItem(
      publicImagesCacheKey,
      JSON.stringify(images.map(serializeImage)),
    )
  } catch {
    // Storage can fail in private browsing or when the quota is full.
  }
}

export function usePublicImages({ enabled }: { enabled: boolean }) {
  const fallbackData = useMemo(() => loadCachedPublicImages(), [])
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<GalleryImage[]>(
    enabled && hasFirebaseConfig ? publicImagesKey : null,
    loadPublicImages,
    {
      fallbackData,
      onSuccess: saveCachedPublicImages,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  )

  const images = data ?? []
  const loadState: LoadState = !hasFirebaseConfig
    ? 'offline'
    : error
      ? 'offline'
      : isLoading && images.length === 0
        ? 'loading'
        : 'ready'

  const refreshPublicImages = useCallback(() => {
    if (!enabled || !hasFirebaseConfig) return
    void mutate()
  }, [enabled, mutate])

  const updatePublicImage = useCallback((nextImage: GalleryImage) => {
    void mutate(
      (currentImages = []) => {
        const nextImages = currentImages.map((image) =>
          image.id === nextImage.id ? nextImage : image,
        )
        saveCachedPublicImages(nextImages)
        return nextImages
      },
      { revalidate: false },
    )
  }, [mutate])

  const deletePublicImage = useCallback((imageId: string) => {
    void mutate(
      (currentImages = []) => {
        const nextImages = currentImages.filter((image) => image.id !== imageId)
        saveCachedPublicImages(nextImages)
        return nextImages
      },
      { revalidate: false },
    )
  }, [mutate])

  return {
    images,
    loadState,
    refreshPublicImages,
    updatePublicImage,
    deletePublicImage,
  }
}
