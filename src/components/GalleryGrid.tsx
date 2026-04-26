import { Link } from 'react-router'
import type { GalleryImage, GalleryThumbSettings } from '../types'

export function GalleryGrid({
  images,
  thumbSettings,
}: {
  images: GalleryImage[]
  thumbSettings: GalleryThumbSettings
}) {
  return (
    <section
      aria-label="Image gallery"
      className="image-grid"
      data-frame={thumbSettings.frame}
      data-fit={thumbSettings.fit}
      data-y={thumbSettings.verticalAlign}
    >
      {images.map((image) => (
        <Link className="image-tile" key={image.id} to={`/images/${image.id}`}>
          <img src={image.thumbUrl} alt={image.title} loading="lazy" />
          <span>{image.title}</span>
        </Link>
      ))}
    </section>
  )
}
