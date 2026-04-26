import { Link, useNavigate, useParams } from 'react-router'
import { useState, type FormEvent } from 'react'
import {
  InformationCircleIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { RatingControl } from '../components/RatingControl'
import { TouchImageViewer } from '../components/TouchImageViewer'
import { slugify } from '../lib/gallery'
import { getHighResolutionImageUrl } from '../lib/highResolutionApi'
import { updateImageMetadata } from '../lib/metadataApi'
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
  const currentIndex = images.findIndex((item) => item.id === imageId)
  const image = currentIndex >= 0 ? images[currentIndex] : undefined
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
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [metadataDraftImageId, setMetadataDraftImageId] = useState('')
  const [metadataTitle, setMetadataTitle] = useState('')
  const [metadataDescription, setMetadataDescription] = useState('')
  const [metadataTagsText, setMetadataTagsText] = useState('')
  const [metadataStatus, setMetadataStatus] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  )

  if (!image) {
    return <PlaceholderPage title="Image not found" user={user} />
  }

  const previousImage = currentIndex > 0 ? images[currentIndex - 1] : null
  const nextImage =
    currentIndex < images.length - 1 ? images[currentIndex + 1] : null
  const isMetadataDraftCurrent = metadataDraftImageId === image.id
  const metadataFormTitle = isMetadataDraftCurrent ? metadataTitle : image.title
  const metadataFormDescription = isMetadataDraftCurrent
    ? metadataDescription
    : image.description
  const metadataFormTagsText = isMetadataDraftCurrent
    ? metadataTagsText
    : image.tags.join(', ')

  const goToPreviousImage = () => {
    if (!previousImage) return
    navigate(`/images/${previousImage.id}`)
  }

  const goToNextImage = () => {
    if (!nextImage) return
    navigate(`/images/${nextImage.id}`)
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

  const saveMetadata = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const title = metadataFormTitle.trim()
    const description = metadataFormDescription.trim()
    const tags = metadataFormTagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (!title) {
      setMetadataStatus('error')
      return
    }

    const previousImage = image
    const nextImage = {
      ...image,
      title,
      description,
      tags,
    }

    onImageChange(nextImage)
    setMetadataStatus('saving')

    try {
      await updateImageMetadata({
        imageId: image.id,
        title,
        description,
        tags,
      })
      setMetadataStatus('idle')
      setIsEditingMetadata(false)
    } catch {
      onImageChange(previousImage)
      setMetadataStatus('error')
    }
  }

  return (
    <main className="detail-layout">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <article>
        <TouchImageViewer
          alt={image.title}
          canGoNext={Boolean(nextImage)}
          canGoPrevious={Boolean(previousImage)}
          key={image.id}
          onNext={goToNextImage}
          onPrevious={goToPreviousImage}
          src={image.displayUrl}
        />
        <div className="detail-copy">
          <div className="detail-tool-row">
            <button
              aria-expanded={isInfoOpen}
              aria-label={
                isInfoOpen ? 'Hide image information' : 'Show image information'
              }
              className="icon-action"
              onClick={() => setIsInfoOpen((current) => !current)}
              type="button"
            >
              {isInfoOpen ? <XMarkIcon /> : <InformationCircleIcon />}
            </button>
            {user ? (
              <button
                aria-expanded={isEditingMetadata}
                aria-label={
                  isEditingMetadata ? 'Close metadata editor' : 'Edit metadata'
                }
                className="icon-action"
                onClick={() =>
                  setIsEditingMetadata((current) => {
                    const next = !current
                    if (next) {
                      setMetadataStatus('idle')
                      setMetadataDraftImageId(image.id)
                      setMetadataTitle(image.title)
                      setMetadataDescription(image.description)
                      setMetadataTagsText(image.tags.join(', '))
                    }
                    return next
                  })
                }
                type="button"
              >
                {isEditingMetadata ? <XMarkIcon /> : <PencilSquareIcon />}
              </button>
            ) : null}
          </div>
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
          {user && isEditingMetadata ? (
            <form className="metadata-editor" onSubmit={saveMetadata}>
              <label>
                <span>Title</span>
                <input
                  disabled={metadataStatus === 'saving'}
                  onChange={(event) => {
                    setMetadataDraftImageId(image.id)
                    setMetadataTitle(event.target.value)
                  }}
                  required
                  type="text"
                  value={metadataFormTitle}
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  disabled={metadataStatus === 'saving'}
                  onChange={(event) => {
                    setMetadataDraftImageId(image.id)
                    setMetadataDescription(event.target.value)
                  }}
                  rows={4}
                  value={metadataFormDescription}
                />
              </label>
              <label>
                <span>Tags</span>
                <input
                  disabled={metadataStatus === 'saving'}
                  onChange={(event) => {
                    setMetadataDraftImageId(image.id)
                    setMetadataTagsText(event.target.value)
                  }}
                  placeholder="city, night, texture"
                  type="text"
                  value={metadataFormTagsText}
                />
              </label>
              {metadataStatus === 'error' ? (
                <p role="alert">
                  Could not update the image information. Title is required.
                </p>
              ) : null}
              <button
                className="primary-action"
                disabled={metadataStatus === 'saving'}
                type="submit"
              >
                {metadataStatus === 'saving' ? 'Saving' : 'Save changes'}
              </button>
            </form>
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
