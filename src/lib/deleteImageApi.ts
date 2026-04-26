import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from './firebase'

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-northeast1'

export async function deleteImage(imageId: string) {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.')
  }

  const functions = getFunctions(firebaseApp, functionsRegion)
  const deleteImageCallable = httpsCallable(functions, 'deleteImage')
  await deleteImageCallable({ imageId })
}
