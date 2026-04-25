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
import { MainLayout } from './layouts/MainLayout'
import { firebaseApp, hasFirebaseConfig } from './lib/firebase'
import { buildTags, loadPublicImages } from './lib/gallery'
import { AdminImagePage } from './pages/AdminImagePage'
import { AdminPage } from './pages/AdminPage'
import { AdminUploadPage } from './pages/AdminUploadPage'
import { GalleryPage } from './pages/GalleryPage'
import { ImageDetailPage } from './pages/ImageDetailPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { TagGalleryPage } from './pages/TagGalleryPage'
import { TagsPage } from './pages/TagsPage'
import type { GalleryImage, LoadState } from './types'

function App() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loadState, setLoadState] = useState<LoadState>(
    hasFirebaseConfig ? 'loading' : 'offline',
  )
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (!firebaseApp) return undefined
    return onAuthStateChanged(getAuth(firebaseApp), setUser)
  }, [])

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

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <GalleryPage images={sortedImages} loadState={loadState} title="Latest" />
          }
        />
        <Route
          path="/images/:imageId"
          element={<ImageDetailPage images={sortedImages} user={user} />}
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
          path="/favorites"
          element={<PlaceholderPage title="Favorites" user={user} />}
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
