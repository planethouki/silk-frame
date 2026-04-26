import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from './firebase'

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-northeast1'

function functionsInstance() {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.')
  }

  return getFunctions(firebaseApp, functionsRegion)
}

export async function updateImageMetadata({
  imageId,
  title,
  description,
  tags,
}: {
  imageId: string
  title: string
  description: string
  tags: string[]
}) {
  const updateMetadata = httpsCallable(functionsInstance(), 'updateImageMetadata')
  await updateMetadata({
    imageId,
    title,
    description,
    tags,
  })
}
