import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import './App.css'
import { AgeGate } from './components/AgeGate'
import { MainLayout } from './layouts/MainLayout'
import {
  hasAgeVerificationCookie,
  saveAgeVerificationCookie,
} from './lib/ageVerification'
import { firebaseApp, hasFirebaseConfig } from './lib/firebase'
import { buildTags } from './lib/gallery'
import { usePublicImages } from './lib/usePublicImages'
import { AdminImagePage } from './pages/AdminImagePage'
import { AdminPage } from './pages/AdminPage'
import { AdminUploadPage } from './pages/AdminUploadPage'
import { GalleryPage } from './pages/GalleryPage'
import { ImageDetailPage } from './pages/ImageDetailPage'
import { TagGalleryPage } from './pages/TagGalleryPage'
import { TagsPage } from './pages/TagsPage'

const isGalleryRoute = (pathname: string) =>
  pathname === '/' || pathname === '/tags' || pathname.startsWith('/tags/')

const recentRefreshWindowMs = 5000

function App() {
  const location = useLocation()
  const previousPathnameRef = useRef(location.pathname)
  const lastPublicImagesRefreshAtRef = useRef(0)
  const [user, setUser] = useState<User | null>(null)
  const [isAgeVerified, setIsAgeVerified] = useState(hasAgeVerificationCookie)
  const {
    images,
    loadState,
    refreshPublicImages,
    updatePublicImage,
    deletePublicImage,
  } = usePublicImages({ enabled: isAgeVerified })

  const refreshGalleryImages = useCallback(() => {
    lastPublicImagesRefreshAtRef.current = Date.now()
    refreshPublicImages()
  }, [refreshPublicImages])

  const refreshGalleryImagesIfStale = useCallback(() => {
    const lastRefreshAt = lastPublicImagesRefreshAtRef.current
    if (Date.now() - lastRefreshAt < recentRefreshWindowMs) return

    refreshGalleryImages()
  }, [refreshGalleryImages])

  useEffect(() => {
    if (!isAgeVerified) return undefined
    if (!firebaseApp) return undefined
    return onAuthStateChanged(getAuth(firebaseApp), setUser)
  }, [isAgeVerified])

  useEffect(() => {
    const previousPathname = previousPathnameRef.current
    const nextPathname = location.pathname

    previousPathnameRef.current = nextPathname

    if (!isAgeVerified) return
    if (!isGalleryRoute(nextPathname)) return
    if (isGalleryRoute(previousPathname)) return

    refreshGalleryImagesIfStale()
  }, [isAgeVerified, location.pathname, refreshGalleryImagesIfStale])

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
            <GalleryPage images={sortedImages} loadState={loadState} title="Gallery" />
          }
        />
        <Route
          path="/images/:imageId"
          element={
            <ImageDetailPage
              images={sortedImages}
              onImageDelete={deletePublicImage}
              onImageChange={updatePublicImage}
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
          element={
            <AdminUploadPage
              user={user}
              onUploadComplete={refreshGalleryImages}
            />
          }
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
