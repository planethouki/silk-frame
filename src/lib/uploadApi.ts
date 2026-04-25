import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from './firebase'
import type { PreparedImageUpload } from './imageProcessing'

type CreateImageUploadResponse = {
  imageId: string
  uploadUrls: {
    original: string
    display: string
    thumb: string
  }
}

type CreateImageUploadInput = {
  title: string
  description: string
  tags: string[]
  visibility: 'public' | 'private'
  originalContentType: string
  originalExtension: string
  width: number
  height: number
  takenAt: string
  sortAt: string
}

const functionsRegion =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-northeast1'

function functionsInstance() {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.')
  }

  return getFunctions(firebaseApp, functionsRegion)
}

function extensionFromFile(file: File) {
  const extension = file.name.split('.').pop()
  return extension ? extension.toLowerCase() : 'jpg'
}

async function putBlob(
  variant: 'original' | 'display' | 'thumb',
  url: string,
  body: Blob,
  contentType: string,
) {
  let response: Response

  try {
    response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body,
    })
  } catch (caughtError) {
    throw new Error(
      `S3 upload failed before receiving a response (${variant}). Check the S3 bucket CORS configuration for PUT and Content-Type.`,
      { cause: caughtError },
    )
  }

  if (!response.ok) {
    throw new Error(`S3 upload failed (${variant}): ${response.status}`)
  }
}

export async function uploadImage({
  prepared,
  title,
  description,
  tags,
  visibility,
  takenAt,
  sortAt,
}: {
  prepared: PreparedImageUpload
  title: string
  description: string
  tags: string[]
  visibility: 'public' | 'private'
  takenAt: string
  sortAt: string
}) {
  const functions = functionsInstance()
  const createImageUpload = httpsCallable<
    CreateImageUploadInput,
    CreateImageUploadResponse
  >(functions, 'createImageUpload')
  const completeImageUpload = httpsCallable(functions, 'completeImageUpload')

  const createResult = await createImageUpload({
    title,
    description,
    tags,
    visibility,
    originalContentType: prepared.original.type || 'application/octet-stream',
    originalExtension: extensionFromFile(prepared.original),
    width: prepared.width,
    height: prepared.height,
    takenAt,
    sortAt,
  })

  const { imageId, uploadUrls } = createResult.data

  await Promise.all([
    putBlob(
      'original',
      uploadUrls.original,
      prepared.original,
      prepared.original.type || 'application/octet-stream',
    ),
    putBlob('display', uploadUrls.display, prepared.display, 'image/webp'),
    putBlob('thumb', uploadUrls.thumb, prepared.thumb, 'image/webp'),
  ])

  await completeImageUpload({
    imageId,
    width: prepared.width,
    height: prepared.height,
    takenAt,
    sortAt,
  })

  return imageId
}
