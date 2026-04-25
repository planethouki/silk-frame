import { Link, useNavigate, useParams } from 'react-router'
import { useState } from 'react'
import { slugify } from '../lib/gallery'
import { getHighResolutionImageUrl } from '../lib/highResolutionApi'
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
  const [highResRequest, setHighResRequest] = useState<{
    imageId: string
    status: 'loading' | 'ready' | 'error'
    url?: string
    expiresAt?: string
  } | null>(null)

  if (!image) {
    return <PlaceholderPage title="Image not found" user={user} />
  }

  const currentHighRes =
    highResRequest?.imageId === image.id ? highResRequest : null
  const highResState = currentHighRes?.status ?? 'idle'
  const highResUrl = currentHighRes?.url ?? ''

  const requestHighResolutionImage = async () => {
    setHighResRequest({ imageId: image.id, status: 'loading' })

    try {
      const result = await getHighResolutionImageUrl(image.id)
      setHighResRequest({
        imageId: image.id,
        status: 'ready',
        url: result.url,
        expiresAt: result.expiresAt,
      })
    } catch {
      setHighResRequest({ imageId: image.id, status: 'error' })
    }
  }

  const highResExpiresText = currentHighRes?.expiresAt
    ? new Date(currentHighRes.expiresAt).toLocaleTimeString()
    : ''

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
            <div className="high-res-panel">
              <button
                className="primary-action"
                type="button"
                onClick={requestHighResolutionImage}
                disabled={highResState === 'loading'}
              >
                {highResState === 'loading' ? 'Loading high-res' : 'View high-res'}
              </button>
              {highResState === 'ready' ? (
                <>
                  <a href={highResUrl} target="_blank" rel="noreferrer">
                    Open original
                  </a>
                  <small>Signed URL expires at {highResExpiresText}</small>
                </>
              ) : null}
              {highResState === 'error' ? (
                <p role="alert">
                  Could not load the high-resolution image. Check your admin role
                  and Functions configuration.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
      {highResUrl ? (
        <section className="high-res-preview" aria-label="High-resolution preview">
          <img src={highResUrl} alt={`${image.title} high resolution`} />
        </section>
      ) : null}
    </main>
  )
}
