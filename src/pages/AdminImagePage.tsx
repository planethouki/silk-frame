import { useParams } from 'react-router'
import { PlaceholderPage } from './PlaceholderPage'
import type { GalleryImage } from '../types'
import type { User } from 'firebase/auth'

export function AdminImagePage({
  images,
  user,
}: {
  images: GalleryImage[]
  user: User | null
}) {
  const { imageId } = useParams()
  const image = images.find((item) => item.id === imageId)

  return <PlaceholderPage title={image?.title ?? 'Edit image'} user={user} />
}
