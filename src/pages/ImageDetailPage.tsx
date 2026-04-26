import { Link, useNavigate, useParams } from 'react-router'
import { useState } from 'react'
import {
  InformationCircleIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { RatingControl } from '../components/RatingControl'
import { slugify } from '../lib/gallery'
import { getHighResolutionImageUrl } from '../lib/highResolutionApi'
import { updateImageRating } from '../lib/ratingsApi'
import { PlaceholderPage } from './PlaceholderPage'
import type { GalleryImage, ImageRating } from '../types'
import type { User } from 'firebase/auth'

export function ImageDetailPage({
  images,
  user,
  onImageChange,
}: {
  images: GalleryImage[]
  user: User | null
  onImageChange: (image: GalleryImage) => void
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
  const [ratingStatus, setRatingStatus] = useState<
    'idle' | 'saving-heart' | 'saving-star' | 'error'
  >('idle')
  const [isEditingRatings, setIsEditingRatings] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)

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

  const saveRating = async (ratingKind: 'heart' | 'star', value: ImageRating) => {
    const previousImage = image
    const nextImage = {
      ...image,
      [ratingKind === 'heart' ? 'heartRating' : 'starRating']: value,
    }

    onImageChange(nextImage)
    setRatingStatus(ratingKind === 'heart' ? 'saving-heart' : 'saving-star')

    try {
      await updateImageRating(image.id, ratingKind, value)
      setRatingStatus('idle')
    } catch {
      onImageChange(previousImage)
      setRatingStatus('error')
    }
  }

  return (
    <main className="detail-layout">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <article>
        <img className="detail-image" src={image.displayUrl} alt={image.title} />
        <div className="detail-copy">
          <button
            aria-expanded={isInfoOpen}
            aria-label={isInfoOpen ? 'Hide image information' : 'Show image information'}
            className="icon-action detail-info-button"
            onClick={() => setIsInfoOpen((current) => !current)}
            type="button"
          >
            {isInfoOpen ? <XMarkIcon /> : <InformationCircleIcon />}
          </button>
          {isInfoOpen ? (
            <div className="detail-info-panel">
              <dl>
                <div>
                  <dt>Title</dt>
                  <dd>{image.title}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{image.description || '-'}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{image.sortAt.toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          ) : null}
          <div className="tag-row">
            {image.tags.map((tag) => (
              <Link key={tag} to={`/tags/${slugify(tag)}`}>
                #{tag}
              </Link>
            ))}
          </div>
          {user ? (
            <>
              <div className="rating-panel" aria-label="Admin ratings">
                <div className="rating-summary">
                  <span aria-label="Heart rating">
                    ♥ {image.heartRating ?? '-'}
                  </span>
                  <span aria-label="Star rating">★ {image.starRating ?? '-'}</span>
                  <button
                    aria-label={
                      isEditingRatings ? 'Close rating editor' : 'Edit ratings'
                    }
                    className="icon-action"
                    onClick={() => setIsEditingRatings((current) => !current)}
                    type="button"
                  >
                    {isEditingRatings ? <XMarkIcon /> : <PencilSquareIcon />}
                  </button>
                </div>
                {isEditingRatings ? (
                  <div className="rating-editor">
                    <RatingControl
                      activeSymbol="♥"
                      disabled={ratingStatus === 'saving-heart'}
                      inactiveSymbol="♡"
                      label="Heart rating"
                      onChange={(value) => void saveRating('heart', value)}
                      value={image.heartRating}
                    />
                    <RatingControl
                      activeSymbol="★"
                      disabled={ratingStatus === 'saving-star'}
                      inactiveSymbol="☆"
                      label="Star rating"
                      onChange={(value) => void saveRating('star', value)}
                      value={image.starRating}
                    />
                    {ratingStatus === 'error' ? (
                      <p role="alert">Could not update the rating.</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
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
            </>
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
