import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from './firebase'

type HighResolutionImageResponse = {
  imageId: string
  url: string
  expiresAt: string
}

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-northeast1'

export async function getHighResolutionImageUrl(imageId: string) {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.')
  }

  const functions = getFunctions(firebaseApp, functionsRegion)
  const getHighResolutionImage = httpsCallable<
    { imageId: string },
    HighResolutionImageResponse
  >(functions, 'getHighResolutionImage')

  const result = await getHighResolutionImage({ imageId })
  return result.data
}
