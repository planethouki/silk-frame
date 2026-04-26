import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import './App.css'
import { AgeGate } from './components/AgeGate'
import { MainLayout } from './layouts/MainLayout'
import {
  hasAgeVerificationCookie,
  saveAgeVerificationCookie,
} from './lib/ageVerification'
import { firebaseApp, hasFirebaseConfig } from './lib/firebase'
import { buildTags, loadPublicImages } from './lib/gallery'
import { AdminImagePage } from './pages/AdminImagePage'
import { AdminPage } from './pages/AdminPage'
import { AdminUploadPage } from './pages/AdminUploadPage'
import { GalleryPage } from './pages/GalleryPage'
import { ImageDetailPage } from './pages/ImageDetailPage'
import { TagGalleryPage } from './pages/TagGalleryPage'
import { TagsPage } from './pages/TagsPage'
import type { GalleryImage, LoadState } from './types'

function App() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loadState, setLoadState] = useState<LoadState>(
    hasFirebaseConfig ? 'loading' : 'offline',
  )
  const [user, setUser] = useState<User | null>(null)
  const [isAgeVerified, setIsAgeVerified] = useState(hasAgeVerificationCookie)

  useEffect(() => {
    if (!isAgeVerified) return undefined

    let mounted = true

    loadPublicImages()
      .then((nextImages) => {
        if (!mounted) return
        setImages(nextImages)
        setLoadState(hasFirebaseConfig ? 'ready' : 'offline')
      })
      .catch(() => {
        if (!mounted) return
        setImages([])
        setLoadState('offline')
      })

    return () => {
      mounted = false
    }
  }, [isAgeVerified])

  useEffect(() => {
    if (!isAgeVerified) return undefined
    if (!firebaseApp) return undefined
    return onAuthStateChanged(getAuth(firebaseApp), setUser)
  }, [isAgeVerified])

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime()),
    [images],
  )

  const tags = useMemo(() => buildTags(sortedImages), [sortedImages])

  const signIn = async (email: string, password: string) => {
    if (!firebaseApp) return
    await signInWithEmailAndPassword(getAuth(firebaseApp), email, password)
  }

  const signOutAdmin = async () => {
    if (!firebaseApp) return
    await signOut(getAuth(firebaseApp))
  }

  const updateImageInState = (nextImage: GalleryImage) => {
    setImages((currentImages) =>
      currentImages.map((image) =>
        image.id === nextImage.id ? nextImage : image,
      ),
    )
  }

  const confirmAge = () => {
    saveAgeVerificationCookie()
    setIsAgeVerified(true)
  }

  if (!isAgeVerified) {
    return <AgeGate onConfirm={confirmAge} />
  }

  return (
    <Routes>
      <Route element={<MainLayout user={user} />}>
        <Route
          path="/"
          element={
            <GalleryPage images={sortedImages} loadState={loadState} title="Latest" />
          }
        />
        <Route
          path="/images/:imageId"
          element={
            <ImageDetailPage
              images={sortedImages}
              onImageChange={updateImageInState}
              user={user}
            />
          }
        />
        <Route path="/tags" element={<TagsPage tags={tags} />} />
        <Route
          path="/tags/:slug"
          element={
            <TagGalleryPage images={sortedImages} tags={tags} loadState={loadState} />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPage
              user={user}
              signIn={signIn}
              signOutAdmin={signOutAdmin}
              hasFirebaseConfig={hasFirebaseConfig}
            />
          }
        />
        <Route
          path="/admin/upload"
          element={<AdminUploadPage user={user} />}
        />
        <Route
          path="/admin/images/:imageId"
          element={<AdminImagePage images={sortedImages} user={user} />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
