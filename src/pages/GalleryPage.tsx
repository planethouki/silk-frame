import { GalleryGrid } from '../components/GalleryGrid'
import { PageHeading } from '../components/PageHeading'
import type { GalleryImage, LoadState } from '../types'

export function GalleryPage({
  images,
  loadState,
  title = 'Latest',
}: {
  images: GalleryImage[]
  loadState: LoadState
  title?: string
}) {
  return (
    <main>
      <PageHeading
        eyebrow="Personal image gallery"
        title={title}
        loadState={loadState}
        imageCount={images.length}
      />
      <GalleryGrid images={images} />
    </main>
  )
}
