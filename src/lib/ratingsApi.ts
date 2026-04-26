import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from './firebase'
import type { ImageRating } from '../types'

type RatingKind = 'heart' | 'star'

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-northeast1'

function functionsInstance() {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.')
  }

  return getFunctions(firebaseApp, functionsRegion)
}

export async function updateImageRating(
  imageId: string,
  ratingKind: RatingKind,
  value: ImageRating,
) {
  const updateRating = httpsCallable(functionsInstance(), 'updateImageRating')
  await updateRating({
    imageId,
    ratingKind,
    value,
  })
}
