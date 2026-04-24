import { Link } from 'react-router'
import type { GalleryImage } from '../types'

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return (
    <section className="image-grid" aria-label="Image gallery">
      {images.map((image) => (
        <Link className="image-tile" key={image.id} to={`/images/${image.id}`}>
          <img src={image.thumbUrl} alt={image.title} loading="lazy" />
          <span>{image.title}</span>
        </Link>
      ))}
    </section>
  )
}
