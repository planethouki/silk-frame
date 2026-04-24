import { useParams } from 'react-router'
import { slugify } from '../lib/gallery'
import { GalleryPage } from './GalleryPage'
import type { GalleryImage, GalleryTag, LoadState } from '../types'

export function TagGalleryPage({
  images,
  tags,
  loadState,
}: {
  images: GalleryImage[]
  tags: GalleryTag[]
  loadState: LoadState
}) {
  const { slug = '' } = useParams()
  const tag = tags.find((item) => item.slug === slug)
  const visibleImages = images.filter((image) =>
    image.tags.some((imageTag) => slugify(imageTag) === slug),
  )

  return (
    <GalleryPage
      images={visibleImages}
      loadState={loadState}
      title={tag?.tag ?? 'Tag'}
    />
  )
}
