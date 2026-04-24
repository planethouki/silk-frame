import { Link, useNavigate, useParams } from 'react-router'
import { slugify } from '../lib/gallery'
import { PlaceholderPage } from './PlaceholderPage'
import type { GalleryImage } from '../types'
import type { User } from 'firebase/auth'

export function ImageDetailPage({
  images,
  user,
}: {
  images: GalleryImage[]
  user: User | null
}) {
  const navigate = useNavigate()
  const { imageId } = useParams()
  const image = images.find((item) => item.id === imageId)

  if (!image) {
    return <PlaceholderPage title="Image not found" user={user} />
  }

  return (
    <main className="detail-layout">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <article>
        <img className="detail-image" src={image.displayUrl} alt={image.title} />
        <div className="detail-copy">
          <p className="eyebrow">{image.sortAt.toLocaleDateString()}</p>
          <h1>{image.title}</h1>
          <p>{image.description}</p>
          <div className="tag-row">
            {image.tags.map((tag) => (
              <Link key={tag} to={`/tags/${slugify(tag)}`}>
                #{tag}
              </Link>
            ))}
          </div>
          {user ? (
            <div className="admin-note">
              High-resolution access will be requested through a signed Function URL in
              Phase 2.
            </div>
          ) : null}
        </div>
      </article>
    </main>
  )
}
